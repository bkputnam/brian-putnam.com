wasm-pack build --dev --target web

rm -rf ../../client/nbody/wasm/*
cp pkg/* ../../client/nbody/wasm