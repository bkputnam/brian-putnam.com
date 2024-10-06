wasm-pack build --release --target web

# This doesn't seem to do anything. Or at least, not what I wanted it to do
# cargo wasm2map pkg/nbody_wasm_bg.wasm --patch --base-url http://localhost:8080/nbody/wasm

rm -rf ../../client/nbody/wasm/*
cp pkg/* ../../client/nbody/wasm