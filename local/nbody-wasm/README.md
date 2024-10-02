# nbody-wasm

Rust source code for the wasm plugin for brian-putnam.com/nbody. Simulates
N celestial objects interacting with each other gravitationally.

## Build and deploy:

```
./build_and_deploy.sh
```

Builds code to wasm files (in `./pkg`), and then copies those files to
`client/nbody/wasm` so that the client-side code can use it.
