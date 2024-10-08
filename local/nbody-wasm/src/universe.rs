use crate::{
    quad_tree::{QuadTree, QuadTreeContents},
    set_panic_hook::set_panic_hook,
    vec2::Vec2,
};
use std::iter::repeat;
use wasm_bindgen::prelude::*;

const DELTA_T: f64 = 0.1;

// If a node's size / node's distance is smaller than this number, use the node
// as an approximation of its contents.
const QUADTREE_THETA: f64 = 0.7;

#[wasm_bindgen]
pub struct Universe {
    positions: Vec<Vec2>,
    masses: Vec<f64>,
    velocities: Vec<Vec2>,
    accelerations: Vec<Vec2>,
    potential_energies_old: Vec<f64>,
    potential_energies_new: Vec<f64>,
    quadtree: QuadTree,
}

#[wasm_bindgen]
impl Universe {
    pub fn new(num_bodies: usize) -> Universe {
        set_panic_hook();
        Universe {
            positions: repeat(Vec2::zero()).take(num_bodies).collect(),
            masses: repeat(0.0f64).take(num_bodies).collect(),
            velocities: repeat(Vec2::zero()).take(num_bodies).collect(),
            accelerations: repeat(Vec2::zero()).take(num_bodies).collect(),
            potential_energies_old: repeat(0.0f64).take(num_bodies).collect(),
            potential_energies_new: repeat(0.0f64).take(num_bodies).collect(),
            quadtree: QuadTree::new(&vec![], &vec![]),
        }
    }

    // This is only used in testing; real usage (via javascript) should use the
    // get_positions()/get_masses()/etc methods to get access to the underlying
    // memory and populate it that way.
    // Note: `pub(crate)` allows us to have complex parameter types that aren't
    // compatible with WASM.
    #[cfg(test)]
    pub(crate) fn set_i(&mut self, i: usize, pos: Vec2, mass: f64, vel: Vec2) {
        self.positions[i] = pos;
        self.masses[i] = mass;
        self.velocities[i] = vel;
    }

    pub fn init(&mut self) {
        self.cancel_momentum();
        self.quadtree = QuadTree::new(&self.positions, &self.masses);
        self.compute_new_potential_energies();
    }

    fn step(&mut self) {
        // Clean up artifacts from last time
        self.clear_accelerations();
        self.make_new_potential_energies_old();

        // Sum forces and move each point incrementally
        self.compute_accelerations();
        // Note that self.quadtree gets recomputed in this step
        self.update_velocities_and_positions();

        // Alternative to gravity softening: recompute velocity magnitudes based
        // on change in gravitational potential energy.
        self.compute_new_potential_energies();
        self.tweak_velocities();

        // Bumping into the boundaries can impart momentum to the system.
        // Random rounding errors can have the same effect, but (probably) more
        // slowly.
        // self.cancel_momentum();
    }

    fn compute_accelerations(&mut self) {
        let accelerations = &mut self.accelerations;

        for (body_index, body_pos) in self.positions.iter().copied().enumerate()
        {
            walk_quadtree(
                body_index,
                body_pos,
                &self.positions,
                &self.masses,
                &self.quadtree,
                |attractor_pos: Vec2, attractor_mass: f64| {
                    let dist_vec = attractor_pos - body_pos;
                    let dist_mag_sq_actual = dist_vec.magnitude_squared();
                    let dist_mag_sq = dist_mag_sq_actual.max(100.0);

                    // The "Quake3 Fast Inverse Square Root" algorithm has been
                    // investigated for use here, and it was found to be slower than
                    // the naive "1.0 / val.sqrt()" method. See README.md for
                    // details.
                    let dist_unit = dist_vec / dist_mag_sq_actual.sqrt();

                    // Universal gravitational formula:
                    // F = G * m_1 * m_2 / dist_mag^2 * dist_vec_unit
                    // F = m_1 * a_1 = m_2 * a_2
                    // dist_vec_unit = dist_vec / dist_mag
                    // Let G=1 in our universe, and solve for a_1:
                    // a_1 = m_2 / dist_mag^2 * dist_unit
                    let inv_dist = dist_unit * (1.0 / dist_mag_sq);

                    accelerations[body_index] += inv_dist * attractor_mass;
                },
            );
        }
    }

    fn update_velocities_and_positions(&mut self) {
        for i in 0..self.get_num_bodies() {
            self.velocities[i] += self.accelerations[i] * DELTA_T;
            self.positions[i] += self.velocities[i] * DELTA_T;
        }

        // QuadTree needs to be recomputed every time positions change, but can
        // be reused in between position updates.
        //
        // Possible future optimization: maybe there's a way to cheaply
        // reshuffle the existing QuadTree without recreating it from scratch?
        // The idea is basically that points don't move much between iterations,
        // and so most will stay in the same tree node that they were in before.
        // Points that leave their nodes could (usually) just be removed and
        // reinserted, or maybe just walked around the tree a little to find the
        // correct node.
        //
        // Open problems:
        // - Would this actually be faster? Creating a QuadTree isn't *that*
        //      expensive (n*logn)
        // - How to handle the case when a point leaves the root node? (Can't
        //      easily reinsert if the point has completely left the outermost
        //      bounds)
        // - How to reclaim newly-emptied nodes? The unused_nodes field was
        //      intended for this, but never actually used.
        // - How to update center_of_mass and total_mass? Do we need to
        //      recompute those from scratch? Do we need to update all parents?
        // - Maybe more?
        self.quadtree = QuadTree::new(&self.positions, &self.masses);
    }

    fn compute_new_potential_energies(&mut self) {
        let potential_energies_new = &mut self.potential_energies_new;
        for (body_index, &body_pos) in self.positions.iter().enumerate() {
            walk_quadtree(
                body_index,
                body_pos,
                &self.positions,
                &self.masses,
                &self.quadtree,
                |attractor_pos: Vec2, attractor_mass: f64| {
                    let r = (body_pos - attractor_pos).magnitude();
                    if r != 0.0 {
                        let potential = -attractor_mass / (r * r);
                        potential_energies_new[body_index] += potential;
                    }
                },
            );
        }
    }

    // Update the magnitude of the velocity vectors to match their new potential
    // energies. This should hopefully prevent two particles from accelerating
    // past each other when they have a close encounter.
    // self.potential_energies_new is expected to be completely updated before
    // this method is called.
    fn tweak_velocities(&mut self) {
        // The gist here is that the change in kinetic energy should be equal
        // to the change in gravitational potential energy, but opposite.
        // kinetic_energy = k = 1/2 * m * v^2
        // potential_energy = U = - G * M1 * M2 / separation^2
        // So we should have:
        // delta_k = k2 - k1 = -(U2 - U1)
        for i in 0..self.positions.len() {
            let speed_old_squared = self.velocities[i].magnitude_squared();
            let delta_k =
                self.potential_energies_old[i] - self.potential_energies_new[i];
            // delta_k = (1/2 * m * v_old^2) - (1/2 * m * v_new^2)
            // Solve for v_new^2 (to avoid extra sqrt calls) and you get this:
            let new_speed_squared =
                (2.0 * delta_k) / self.masses[i] + speed_old_squared;
            self.velocities[i].set_magnitude_squared(new_speed_squared);
        }
    }

    fn make_new_potential_energies_old(&mut self) {
        // Move potential_energies_new to potential_energies_old. I think this
        // just swaps the pointers inside the Vecs, and so it should be
        // relatively fast.
        std::mem::swap(
            &mut self.potential_energies_new,
            &mut self.potential_energies_old,
        );
        // Zero out potential_energies_new so that the next
        // compute_new_potential_energies call can start with a clean slate.
        for k in self.potential_energies_new.iter_mut() {
            *k = 0.0;
        }
    }

    fn clear_accelerations(&mut self) {
        for a in self.accelerations.iter_mut() {
            a.clear();
        }
    }

    fn cancel_momentum(&mut self) {
        // Make sure the net momentum of the simulation is zero
        let mut total_momentum: Vec2 = Vec2::zero();
        let mut total_mass: f64 = 0.0;
        for (vel, mass) in self
            .velocities
            .iter()
            .copied()
            .zip(self.masses.iter().copied())
        {
            total_momentum += vel * mass;
            total_mass += mass;
        }
        let anti_velocity = total_momentum * (-1.0 / total_mass);
        for mut vel in self.velocities.iter_mut() {
            vel += anti_velocity;
        }

        if cfg!(debug_assertions) {
            total_momentum.clear();
            for (vel, mass) in self
                .velocities
                .iter()
                .copied()
                .zip(self.masses.iter().copied())
            {
                total_momentum += vel * mass;
            }
            if total_momentum.magnitude() > 0.001 {
                panic!(
                    "total_momentum should've been very close to zero: {}",
                    total_momentum.magnitude()
                );
            }
        }
    }

    pub fn step_n(&mut self, n: usize) {
        for _ in 0..n {
            self.step();
        }
    }

    pub fn get_positions(&self) -> *const Vec2 {
        self.positions.as_ptr()
    }

    pub fn get_masses(&self) -> *const f64 {
        self.masses.as_ptr()
    }

    pub fn get_velocities(&self) -> *const Vec2 {
        self.velocities.as_ptr()
    }

    pub fn get_num_bodies(&self) -> usize {
        self.masses.len()
    }
}

fn walk_quadtree<FN: FnMut(Vec2, f64) -> ()>(
    body_index: usize,
    body_pos: Vec2,
    positions: &Vec<Vec2>,
    masses: &Vec<f64>,
    quadtree: &QuadTree,
    mut f: FN,
) {
    quadtree.walk(|_node_index, _depth, node| {
        match &node.contents {
            QuadTreeContents::Points(point_indices) => {
                for &attractor_index in point_indices {
                    if attractor_index != body_index {
                        f(positions[attractor_index], masses[attractor_index]);
                    }
                }
                false // Don't recurse: there are no children anyway
            }
            QuadTreeContents::Children(_) => {
                let node_center_of_mass = node.center_of_mass;
                let dist_to_center =
                    (body_pos - node_center_of_mass).magnitude();
                let diag = node.diagonal_len();
                if diag / dist_to_center < QUADTREE_THETA {
                    f(node_center_of_mass, node.total_mass);
                    // We've accepted the approximation, so don't
                    // recurse
                    false
                } else {
                    // We've rejected the approximation, so recurse and
                    // try again
                    true
                }
            }
        }
    });
}

#[cfg(test)]
mod test {
    use crate::vec2::Vec2;

    use super::Universe;

    // This test prints out positions[0].x and velocities[0].x at every step. A
    // useful thing to do is to plop these in a spreadsheet and graph them
    // against time to see what they're doing. They *should* just oscillate back
    // and forth passing through each other, but close encounters often cause
    // buggy behavior.
    //
    // Once you've identified buggy behavior that you'd like to fix, use
    // conditional breakpoints to step through the code and see why it's
    // happening.
    //
    // This test always "passes" - it's not intended to catch anything in an
    // automated way, it just provides a means to inspect an debug a simple (but
    // often buggy) case.
    #[test]
    fn test_close_encounter() {
        let mut universe = Universe::new(2);
        universe.set_i(
            /* index= */ 0,
            /* pos= */ Vec2 { x: 2.0, y: 0.0 },
            /* mass= */ 1.0,
            /* vel= */ Vec2::zero(),
        );
        universe.set_i(
            /* index= */ 1,
            /* pos= */ Vec2 { x: -2.0, y: 0.0 },
            /* mass= */ 1.0,
            /* vel= */ Vec2::zero(),
        );
        universe.init();

        println!("x\tv");
        for i in 0..400 {
            println!(
                "{}\t{}",
                universe.positions[0].x, universe.velocities[0].x,
            );

            universe.step();
        }

        assert!(true == true);
    }
}
