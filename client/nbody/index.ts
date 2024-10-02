import init, { start_simulation } from "./wasm/nbody_wasm.js";

const SIDE_LEN = document.body.clientHeight;
debugger;

const wasm = await init({});
const universe = start_simulation(500, SIDE_LEN);

const num_bodies = universe.get_num_bodies();
const positions = new Float64Array(
    wasm.memory.buffer, universe.get_positions(), num_bodies * 2);
const masses = new Float64Array(
    wasm.memory.buffer, universe.get_masses(), num_bodies);

const canvas = document.createElement('canvas');
canvas.width = SIDE_LEN;
canvas.height = SIDE_LEN;
document.body.appendChild(canvas);
const context = canvas.getContext("2d")!;

function toCanvasCoords(x: number) {
    return x + canvas.width / 2;
}

function isInBounds(x: number) {
    return x >= 0 && x < canvas.width;
}

function draw() {
    context.clearRect(0, 0, canvas.width, canvas.height)
    context.fillStyle = "#FFF";
    for (let i = 0; i < num_bodies; i++) {
        const x = toCanvasCoords(positions[i * 2]);
        const y = toCanvasCoords(positions[i * 2 + 1]);
        if (isInBounds(x) && isInBounds(y)) {
            context.fillRect(x, y, 1, 1);
        }
    }
}
function drawLoop() {
    draw();
    universe.step_n(1);
    requestAnimationFrame(drawLoop);
}
requestAnimationFrame(drawLoop);

