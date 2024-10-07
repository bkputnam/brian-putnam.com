mod quad_tree;
mod set_panic_hook;
mod universe;
mod vec2;

use universe::Universe;
use wasm_bindgen::prelude::*;

#[wasm_bindgen]
extern "C" {
    // fn alert(s: &str);
}

#[wasm_bindgen]
pub fn start_simulation(num_bodies: usize) -> Universe {
    set_panic_hook::set_panic_hook();
    Universe::new(num_bodies)
}

#[cfg(test)]
mod tests {
    // Note this useful idiom: importing names from outer (for mod tests) scope.
    use super::*;
    use rand::Rng;
    use std::f64::consts::PI;
    use vec2::Vec2;

    const MIN_MASS: f64 = 1.0;
    const MAX_MASS: f64 = 100.0;
    const SIDE_LEN: f64 = 500.0;

    fn init_universe() -> Universe {
        let mut universe = Universe::new(10);
        let mut r = rand::thread_rng();
        for i in 0..universe.get_num_bodies() {
            // Simple way to have more smaller masses than larger masses in the
            // distribution. Note that x^2 < x if x < 1.
            let mass_rand = 1.0; // r.gen_range(0.0..1.0);
            let mass = mass_rand * mass_rand * (MAX_MASS - MIN_MASS) + MIN_MASS;

            let theta: f64 = r.gen_range(0.0..(2.0 * PI));
            let radius: f64 = r.gen_range(0.0..(SIDE_LEN / 2.0));
            let position = Vec2 {
                x: radius * theta.cos(),
                y: radius * theta.sin(),
            };

            // Orbital velocity: V = sqrt( G * M / R )
            // G = 1
            // M is mass of orbited body, in this case all of the mass inside
            // current body's orbit can be approximated as the orbited body
            // R is the radius
            // let mass_inside = radius / side_len;
            // let speed: f64 = (mass_inside / radius).sqrt() + 10.0;
            // let speed: f64 = radius / side_len * 12.0 + 1.0;
            let speed = 7.0 * (radius + 1.0).ln();
            let velocity = Vec2 {
                x: speed * (theta + PI / 2.0).cos(),
                y: speed * (theta + PI / 2.0).sin(),
            };
            universe
                .set_i(i, position.x, position.y, mass, velocity.x, velocity.y);
        }
        universe.init();
        universe
    }

    #[test]
    fn test_step() {
        let mut universe = init_universe();
        universe.step_n(2);
    }
}
