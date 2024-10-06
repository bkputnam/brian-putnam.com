use crate::{
    quad_tree::{QuadTree, QuadTreeContents},
    vec2::Vec2,
};
use rand::Rng;
use std::f64::consts::TAU;
use wasm_bindgen::prelude::*;

// const MIN_MASS: f64 = 1.0;
// const MAX_MASS: f64 = 100.0;

const DELTA_T: f64 = 0.1;

// If a node's size / node's distance is smaller than this number, use the node
// as an approximation of its contents.
const QUADTREE_THETA: f64 = 0.1;

#[wasm_bindgen]
pub struct Universe {
    num_bodies: usize,
    side_len: f64,
    positions: Vec<Vec2>,
    masses: Vec<f64>,
    velocities: Vec<Vec2>,
    accelerations: Vec<Vec2>,
}

#[wasm_bindgen]
impl Universe {
    pub fn new(num_bodies: usize, side_len: f64) -> Universe {
        let mut positions: Vec<Vec2> = Vec::with_capacity(num_bodies);
        let mut masses: Vec<f64> = Vec::with_capacity(num_bodies);
        let mut velocities: Vec<Vec2> = Vec::with_capacity(num_bodies);
        let mut accelerations: Vec<Vec2> = Vec::with_capacity(num_bodies);
        let mut r = rand::thread_rng();

        // for _i in 0..num_bodies {
        //     // Simple way to have more smaller masses than larger masses in the
        //     // distribution. Note that x^2 < x if x < 1.
        //     let mass_rand = 1.0; // r.gen_range(0.0..1.0);
        //     let mass = mass_rand * mass_rand * (MAX_MASS - MIN_MASS) + MIN_MASS;

        //     let theta: f64 = r.gen_range(0.0..(2.0 * PI));
        //     let radius: f64 = r.gen_range(0.0..(side_len / 2.0));
        //     let position = Vec2 {
        //         x: radius * theta.cos(),
        //         y: radius * theta.sin(),
        //     };

        //     // Orbital velocity: V = sqrt( G * M / R )
        //     // G = 1
        //     // M is mass of orbited body, in this case all of the mass inside
        //     // current body's orbit can be approximated as the orbited body
        //     // R is the radius
        //     // let mass_inside = radius / side_len;
        //     // let speed: f64 = (mass_inside / radius).sqrt() + 10.0;
        //     // let speed: f64 = radius / side_len * 12.0 + 1.0;
        //     let speed = 5.0;
        //     let velocity = Vec2 {
        //         x: speed * (theta + PI / 2.0).cos(),
        //         y: speed * (theta + PI / 2.0).sin(),
        //     };
        //     positions.push(position);
        //     masses.push(mass);
        //     velocities.push(velocity);
        //     accelerations.push(Vec2::zero());
        // }

        for n in 0..num_bodies {
            let a = r.gen::<f64>() * TAU;
            let sin = a.sin();
            let cos = a.cos();
            let r = (0..6).map(|_| r.gen::<f64>()).sum::<f64>();
            let r = (r / 3.0 - 1.0).abs();
            positions
                .push(Vec2 { x: cos, y: sin } * (n as f64).sqrt() * 10.0 * r);
            velocities.push(Vec2 { x: sin, y: -cos });
            masses.push(1.0);
            accelerations.push(Vec2::zero());
        }

        let mut sorted_indices: Vec<usize> = (0..num_bodies).collect();
        sorted_indices.sort_by(|a, b| {
            let pos_a = positions[*a];
            let pos_b = positions[*b];
            pos_a
                .magnitude_squared()
                .total_cmp(&pos_b.magnitude_squared())
        });
        let positions_old = positions.clone();
        let velocities_old = velocities.clone();
        // let masses_old = masses.clone();
        let sort_by_indices = |arr: &mut Vec<Vec2>, arr_old: &Vec<Vec2>| {
            for i in 0..num_bodies {
                arr[i] = arr_old[sorted_indices[i]];
            }
        };
        sort_by_indices(&mut positions, &positions_old);
        sort_by_indices(&mut velocities, &velocities_old);
        // sort_by_indices(&masses, &masses_old);

        let mut result = Universe {
            num_bodies,
            side_len,
            positions,
            masses,
            velocities,
            accelerations,
        };
        result.cancel_momentum();
        result
    }

    fn step(&mut self) {
        self.compute_accelerations();
        self.update_velocities_and_positions();
        // Bumping into the boundaries can impart momentum to the system.
        // Random rounding errors can have the same effect, but (probably) more
        // slowly.
        self.cancel_momentum();
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
                let dist_mag_sq = dist_mag_sq_actual.max(5.0);
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
        for i in 0..self.num_bodies {
            if !self.is_in_bounds(i) {
                // The body should be pulled back towards the center as long as
                // it doesn't keep going out of bounds.
                let pos = self.positions[i];
                self.velocities[i] = pos * (-1.0 / pos.magnitude());
            }
            self.velocities[i] += self.accelerations[i] * DELTA_T;
            self.positions[i] += self.velocities[i] * DELTA_T;
            self.accelerations[i].clear();
        }
    }

    fn is_in_bounds(&self, index: usize) -> bool {
        let Vec2 { x, y } = self.positions[index];
        let max_val = self.side_len / 2.0;
        if x > max_val || x < -max_val || y > max_val || y < -max_val {
            false
        } else {
            true
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

    pub fn get_num_bodies(&self) -> usize {
        self.num_bodies
    }

    pub fn get_side_len(&self) -> f64 {
        self.side_len
    }
}
