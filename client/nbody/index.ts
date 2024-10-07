import { getRed, setRgb } from "./util/imagedata_util.js";
import init, { start_simulation } from "./wasm/nbody_wasm.js";

const SIDE_LEN = document.body.clientHeight;

const wasm = await init({});
const universe = start_simulation(5_000, SIDE_LEN);

const num_bodies = universe.get_num_bodies();

const canvas = document.createElement('canvas');
canvas.width = SIDE_LEN;
canvas.height = SIDE_LEN;
document.body.appendChild(canvas);
const context = canvas.getContext("2d")!;

function toCanvasCoords(x: number) {
    return Math.round(x / 2 + canvas.width / 2);
}

function isInBounds(x: number) {
    return x >= 0 && x < canvas.width;
}

function draw() {
    // Not sure why we have to recreate these every time. In previous versions
    // of the code initializing these once, outside this function, worked just
    // fine. However with commit 1be55af I started getting error messages about
    // "attempting to access detached ArrayBuffer". I tracked it down to the
    // line in QuadTree::new where we allocate the `nodes` array using
    // `Vec::with_capacity`. I don't understand what that does to the
    // `positions` and `masses` arrays, but if I comment it out I don't get the
    // "detached ArrayBuffer" messages, and if I uncomment it I have to
    // re-initialize these Float64Arrays on every draw() call as a workaround.
    const positions = new Float64Array(
        wasm.memory.buffer, universe.get_positions(), num_bodies * 2);
    const masses = new Float64Array(
        wasm.memory.buffer, universe.get_masses(), num_bodies);

    context.clearRect(0, 0, canvas.width, canvas.height);

    context.fillStyle = "#000";
    context.fillRect(0, 0, canvas.width, canvas.height);

    let imageData = context.getImageData(0, 0, canvas.width, canvas.height);
    for (let i = 0; i < num_bodies; i++) {
        const x = toCanvasCoords(positions[i * 2]);
        const y = toCanvasCoords(positions[i * 2 + 1]);
        if (isInBounds(x) && isInBounds(y)) {
            let red = getRed(imageData, x, y);
            red = Math.round(255 - (255 - red) * 0.5);
            setRgb(imageData, x, y, red, red, red);
        }
    }
    context.putImageData(imageData, 0, 0);
}
function drawLoop() {
    draw();
    universe.step_n(1);
    requestAnimationFrame(drawLoop);
}
requestAnimationFrame(drawLoop);

