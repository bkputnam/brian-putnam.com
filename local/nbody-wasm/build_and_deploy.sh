wasm-pack build --release --target web

shopt -s globstar
# There should only be one file named workerHelpers.worker.js, but the folder it
# lives in contains a probably-dynamic hash (of the build?) that I don't want to
# hardcode
for f in **/workerHelpers.worker.js; do
    # Work around a bug in wasm-bindgen-rayon where they try to import the main
    # file from a Worker, but it isn't named what they expected it to be named.
    sed -i "s|from '\.\./\.\./\.\./'|from '../../../nbody_wasm.js'|g" $f
done

# I attempted to use wasm2map to generate sourcemaps for the wasm code, but
# this command doesn't seem to do anything. Or at least, not what I wanted it
# to do
# cargo wasm2map pkg/nbody_wasm_bg.wasm --patch --base-url http://localhost:8080/nbody/wasm

rm -rf ../../client/nbody/wasm/*
cp -r pkg/* ../../client/nbody/wasm