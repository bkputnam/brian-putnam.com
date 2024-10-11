import init, { InitOutput, Universe, initThreadPool } from "./wasm/nbody_wasm.js";

const MIN_MASS = 1.0;
const MAX_MASS = 100.0;
const MAX_RADIUS = 350.0;
const NUM_BODIES = 4_000;

function randBetween(min: number, max: number): number {
    return Math.random() * (max - min) + min;
}

export type InitResult = { wasm: InitOutput, universe: Universe };

export async function initUniverse(): Promise<InitResult> {
    const wasm = await init({});
    await initThreadPool(navigator.hardwareConcurrency - 1);
    const universe = Universe.new(NUM_BODIES);

    const positions = new Float64Array(
        wasm.memory.buffer, universe.get_positions(), NUM_BODIES * 2);
    const masses = new Float64Array(
        wasm.memory.buffer, universe.get_masses(), NUM_BODIES);
    const velocities = new Float64Array(
        wasm.memory.buffer, universe.get_velocities(), NUM_BODIES * 2);

    for (let i = 0; i < NUM_BODIES; i++) {
        const mass_rand = 1; // Math.random();
        const mass = mass_rand * mass_rand * (MAX_MASS - MIN_MASS) + MIN_MASS;

        const theta = randBetween(0, 2 * Math.PI);
        const radius = randBetween(0, MAX_RADIUS);
        const position_x = radius * Math.cos(theta);
        const position_y = radius * Math.sin(theta);

        const speed = 6 * Math.log(radius + 1);
        let vel_x = speed * Math.cos(theta + Math.PI / 2);
        let vel_y = speed * Math.sin(theta + Math.PI / 2);

        positions[2 * i] = position_x;
        positions[2 * i + 1] = position_y;
        masses[i] = mass;
        velocities[2 * i] = vel_x;
        velocities[2 * i + 1] = vel_y;
    }

    universe.init();
    return { wasm, universe };
}