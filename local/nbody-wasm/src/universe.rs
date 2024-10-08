use crate::{
    quad_tree::{QuadTree, QuadTreeContents},
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
}

#[wasm_bindgen]
impl Universe {
    pub fn new(num_bodies: usize) -> Universe {
        Universe {
            positions: repeat(Vec2::zero()).take(num_bodies).collect(),
            masses: repeat(0.0f64).take(num_bodies).collect(),
            velocities: repeat(Vec2::zero()).take(num_bodies).collect(),
            accelerations: repeat(Vec2::zero()).take(num_bodies).collect(),
        }
    }

    // This is only used in testing; real usage (via javascript) should use the
    // get_positions()/get_masses()/etc methods to get access to the underlying
    // memory and populate it that way.
    #[cfg(test)]
    pub fn set_i(
        &mut self,
        i: usize,
        pos_x: f64,
        pos_y: f64,
        mass: f64,
        vel_x: f64,
        vel_y: f64,
    ) {
        self.positions[i] = Vec2 { x: pos_x, y: pos_y };
        self.masses[i] = mass;
        self.velocities[i] = Vec2 { x: vel_x, y: vel_y };
    }

    pub fn init(&mut self) {
        self.cancel_momentum();
    }

    fn step(&mut self) {
        self.compute_accelerations();
        self.update_velocities_and_positions();
        // Bumping into the boundaries can impart momentum to the system.
        // Random rounding errors can have the same effect, but (probably) more
        // slowly.
        // self.cancel_momentum();
    }

    fn compute_accelerations(&mut self) {
        let positions = &self.positions;
        let masses = &self.masses;
        let accelerations = &mut self.accelerations;

        let quadtree = QuadTree::new(&self.positions, &self.masses);

        let mut update_body =
            |body_pos: Vec2,
             body_index: usize,
             attractor_pos: Vec2,
             attractor_mass: f64| {
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
            };

        for (body_index, body_pos) in self.positions.iter().copied().enumerate()
        {
            quadtree.walk(|_node_index, _depth, node| {
                match &node.contents {
                    QuadTreeContents::Points(point_indices) => {
                        for &attractor_index in point_indices {
                            if attractor_index != body_index {
                                update_body(
                                    body_pos,
                                    body_index,
                                    positions[attractor_index],
                                    masses[attractor_index],
                                );
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
                            update_body(
                                body_pos,
                                body_index,
                                node_center_of_mass,
                                node.total_mass,
                            );
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
    }

    fn update_velocities_and_positions(&mut self) {
        for i in 0..self.get_num_bodies() {
            self.velocities[i] += self.accelerations[i] * DELTA_T;
            self.positions[i] += self.velocities[i] * DELTA_T;
            self.accelerations[i].clear();
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
