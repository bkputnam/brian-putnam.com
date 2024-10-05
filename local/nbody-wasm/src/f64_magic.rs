// use std::mem::transmute;

// Currently f64.next_up is hidden behind an experimental flag; this code is
// copied and tweaked from the current implementation
fn next_up(val: f64) -> f64 {
    // Some targets violate Rust's assumption of IEEE semantics, e.g. by
    // flushing denormals to zero. This is in general unsound and unsupported,
    // but here we do our best to still produce the correct result on such
    // targets.
    let bits = val.to_bits();
    if val.is_nan() || bits == f64::INFINITY.to_bits() {
        return val;
    }

    let abs = val.abs().to_bits();
    let next_bits = if abs == 0 {
        // f64::TINY_BITS
        return f64::MIN_POSITIVE;
    } else if bits == abs {
        bits + 1
    } else {
        bits - 1
    };
    f64::from_bits(next_bits)
}
