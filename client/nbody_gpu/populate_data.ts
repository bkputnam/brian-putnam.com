export const MIN_MASS = 1.0;
export const MAX_MASS = 100.0;
export const MAX_RADIUS = 350.0;
export const NUM_BODIES = 20_000;
export const BODY_SIZE = 5;

function randBetween(min: number, max: number): number {
    return Math.random() * (max - min) + min;
}

export function initBodies(numBodies: number): Float32Array {
    const resultLen = BODY_SIZE * numBodies;
    const result = new Float32Array(resultLen);

    for (let i = 0; i < numBodies; i++) {
        const index = i * BODY_SIZE;

        const mass_rand = 1; // Math.random();
        const mass = mass_rand * mass_rand * (MAX_MASS - MIN_MASS) + MIN_MASS;

        const theta = randBetween(0, 2 * Math.PI);
        const radius = randBetween(0, MAX_RADIUS);
        const position_x = radius * Math.cos(theta);
        const position_y = radius * Math.sin(theta);

        const speed = 15 * Math.log(radius + 1);
        let vel_x = speed * Math.cos(theta + Math.PI / 2);
        let vel_y = speed * Math.sin(theta + Math.PI / 2);

        result[index + 0] = position_x;
        result[index + 1] = position_y;
        result[index + 2] = vel_x;
        result[index + 3] = vel_y;
        result[index + 4] = mass;
    }
    return result;
}