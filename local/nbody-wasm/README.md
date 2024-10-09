# nbody-wasm

Rust source code for the wasm plugin for brian-putnam.com/nbody. Simulates
N celestial objects interacting with each other gravitationally.

## Build and deploy:

```
./build_and_deploy.sh
```

Builds code to wasm files (in `./pkg`), and then copies those files to
`client/nbody/wasm` so that the client-side code can use it.

## Links

- The YouTube videos that started it all:
    - https://www.youtube.com/watch?v=L9N7ZbGSckk
    - https://www.youtube.com/watch?v=nZHjD3cI-EU
- Wikipedia:
    - [N-Body Simulation](https://en.wikipedia.org/wiki/N-body_simulation)
    - [Leapfrog integration](https://en.wikipedia.org/wiki/N-body_simulation)
        (including kick-step-kick)
- Quake3 Fast Inverse Square Root:
    - https://www.youtube.com/watch?v=p8u_k2LIZyo
- Matlab kick-step-kick example:
    - https://medium.com/quantaphy/the-n-body-problem-2acda67b11b5

## History

### Investigating the Quake3 Fast Inverse Square Root Algorithm

There's a famously hideous "fast inverse square root" algorithm that was found
in the Quake3 source code when it was open-sourced. It involves bit manipulation
of an f32 which is unorthodox to put it mildly. See the Wikipedia article for
more details:

https://en.wikipedia.org/wiki/Fast_inverse_square_root

Since n-body simulations care a lot about speed and inverse square roots (for
getting the magnitude of a vector), it's tempting to try out this "fast inverse
square root" algorithm. This StackOverflow answer gives an example
implementation that I copied for my tests:

https://stackoverflow.com/questions/59081890/is-it-possible-to-write-quakes-fast-invsqrt-function-in-rust#answer-59083859

However, multiple people in the discussion point out that this is no longer the
best way: modern x86 CPUs include a few instructions that do essentially the
same Quake3 algorithm but in hardware and they're both faster and more accurate.
I never figured out how to use them, but I did find them in the rust docs:

- [_mm_rsqrt_ps](https://doc.rust-lang.org/stable/core/arch/x86_64/fn._mm_rsqrt_ps.html):
    Computes 1/sqrt(x) for 4 f32s (1 `__m128`) at a time
- [_mm_rsqrt_ss](https://doc.rust-lang.org/stable/core/arch/x86_64/fn._mm_rsqrt_ss.html):
    Computes 1/sqrt(x) for 1 f32 at a time. But still inputs & outputs a 128 bit
    `__m128` so I'm not sure what the advantage is
- `_mm_rsqrt14_sd` and `_mm_rsqrt14_ss`: I think these are the f64 equivalents

However(2) we're compiling to WASM which doesn't use x86 instructions and
(AFAICT) doesn't have an equivalent instruction to compute `1/sqrt(x)` and so it
isn't immediately obvious that the above advice/warnings apply to our use case.

However(3) WASM does include an instruction for
[sqrt](https://developer.mozilla.org/en-US/docs/WebAssembly/Reference/Numeric/Square_root)
which probably translates to a single CPU instruction under the hood (depending
on the WASM implementation and the available hardware), which is pretty close.
In the Quake3 days there wouldn't have been hardware support for `sqrt`, it
probably would've been supplied by a software library, and was probably slow
(see
[Wikipedia](https://en.wikipedia.org/wiki/Methods_of_computing_square_roots) for
how a software library might've computed square roots).

**TLDR:** It isn't obvious which approach is best for our particular use case,
and so some manual benchmarking is required. So I did that.

I didn't commit the benchmark code but it looked roughly like this:

```rust
fn naive(x: f32) -> f32 {
    1.0 / x.sqrt()
}

fn quake3(x: f32) -> f32 {
    // Copied from that StackOverflow link
}

#[wasm-bindgen]
pub fn benchmark() {
    let ten_million_floats = gen_test_data();

    // performance.now() is the JS performance.now() method, imported via
    // web-sys crate
    let naive_start = performance.now();
    let naive_results: Vec<f32> =
        ten_million_floats.iter().map(|x| naive(x)).collect();
    let naive_ms = performance.now() - naive_start;
    print_results();

    let quake3_start = performance.now();
    let quake3_results: Vec<f32> =
        ten_million_floats.iter().map(|x| quake3(x)).collect();
    let quake3_ms = perfomance.now() - quake3_start;
    print_results();

    for (naive_result, quake3_result) in
        naive_results.iter().zip(quake3_results) {
            if !close_enough(naive_result, quake3_result) {
                panic!(...);
            }
    }
}
```

And the results from my medium-fast laptop (firefox, linux) looked like this:

```
33 ms to generate test data
50 ms for naive method, 199999.98 ops/sec
112 ms for quake3 method, 89285.7 ops/sec
```

**Conclusion:** the naive `1.0 / x.sqrt()` method is faster than the
Quake3 algorithm, and so we shouldn't change how we're doing that.
