mod f64_magic;
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
pub fn start_simulation(num_bodies: usize, side_len: f64) -> Universe {
    set_panic_hook::set_panic_hook();
    Universe::new(num_bodies, side_len)
}

#[cfg(test)]
mod tests {
    // Note this useful idiom: importing names from outer (for mod tests) scope.
    use super::*;

    #[test]
    fn test_step() {
        let mut universe = start_simulation(10, 200.0);
        universe.step_n(2);
    }
}
