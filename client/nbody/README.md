# nbody

Simulation of N celestial bodies interacting via gravity. Largely copied from
https://www.youtube.com/watch?v=L9N7ZbGSckk

## wasm

Most of the computation is done via WASM (Web ASseMbly). The source code is
written in Rust, and lives at `local/nbody-wasm`. The compiled files are copied
to `client/nbody/wasm` so that they can be served alongside our other
client-side files. See `local/nbody-wasm/README.md` for instructions on
building/running that code.
