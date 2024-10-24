import { fail } from "./fail.js";
import * as bkp from "./bkplib.js";

const NUM_BODIES = 2;
const WORKGROUP_SIZE = 64;
const DELTA_T = 0.1;

interface Body {
    x: number,
    y: number,
    x_vel: number,
    y_vel: number,
    mass: number
}

function body(config: Body): [number, number, number, number, number] {
    return [
        config.x,
        config.y,
        config.x_vel,
        config.y_vel,
        config.mass,
    ];
}

async function main() {
    const adapter = await navigator.gpu?.requestAdapter();
    const maybeDevice = await adapter?.requestDevice();
    if (!maybeDevice) {
        fail('fail-msg');
        return;
    }
    // Using two variables like this prevents some compiler errors below
    const device = maybeDevice;

    const module = device.createShaderModule({
        label: 'nbody compute module',
        code: await bkp.loadShaderSource('nbody_compute.wgsl'),
    });

    const pipeline = device.createComputePipeline({
        label: 'doubling compute pipeline',
        layout: 'auto',
        compute: {
            module,
        },
    });

    const input = new Float32Array([
        ...body({ x: 1, y: 0, x_vel: 0, y_vel: -1, mass: 1 }),
        ...body({ x: -1, y: 0, x_vel: 0, y_vel: 1, mass: 1 })
    ]);
    const bodiesA = device.createBuffer({
        label: 'bodiesA',
        size: input.byteLength,
        usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC | GPUBufferUsage.COPY_DST,
    });
    const bodiesB = device.createBuffer({
        label: 'bodiesB',
        size: input.byteLength,
        usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC | GPUBufferUsage.COPY_DST,
    });
    // Copy our input data to that buffer
    device.queue.writeBuffer(bodiesA, 0, input);
    // Note: we also have to write to bodiesB so that it has `mass` populated,
    // since we don't copy that back and forth
    device.queue.writeBuffer(bodiesB, 0, new Float32Array(input));

    const uniformBuffer = device.createBuffer({
        label: 'uniform buffer',
        size: 4 // numBodies: u32
            + 4 // deltaT: f32
        ,
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });
    const uniformArrayBuffer = new ArrayBuffer(uniformBuffer.size);
    new Uint32Array(uniformArrayBuffer, 0, 1)[0] = NUM_BODIES;
    new Float32Array(uniformArrayBuffer, 4, 1)[0] = DELTA_T;
    device.queue.writeBuffer(uniformBuffer, 0, uniformArrayBuffer);

    // create a buffer on the GPU to get a copy of the results
    const resultBuffer = device.createBuffer({
        label: 'result buffer',
        size: input.byteLength,
        usage: GPUBufferUsage.MAP_READ | GPUBufferUsage.COPY_DST
    });

    // Setup a bindGroup to tell the shader which
    // buffer to use for the computation
    const bindGroupA = device.createBindGroup({
        label: 'bindGroup for work buffer',
        layout: pipeline.getBindGroupLayout(0),
        entries: [
            { binding: 0, resource: { buffer: bodiesA } },
            { binding: 1, resource: { buffer: bodiesB } },
            { binding: 2, resource: { buffer: uniformBuffer } },
        ],
    });
    const bindGroupB = device.createBindGroup({
        label: 'bindGroup for work buffer',
        layout: pipeline.getBindGroupLayout(0),
        entries: [
            { binding: 0, resource: { buffer: bodiesB } },
            { binding: 1, resource: { buffer: bodiesA } },
            { binding: 2, resource: { buffer: uniformBuffer } },
        ],
    });

    let runCount = 0;
    const MAX_RUN_COUNT = 4;
    let bindGroup = bindGroupA;
    let outputBuffer = bodiesB;
    async function run() {
        runCount++;

        // Encode commands to do the computation
        const encoder = device.createCommandEncoder({
            label: 'nbody compute encoder',
        });
        const pass = encoder.beginComputePass({
            label: 'nbody compute pass',
        });
        pass.setPipeline(pipeline);
        pass.setBindGroup(0, bindGroup);
        pass.dispatchWorkgroups(Math.ceil(NUM_BODIES / WORKGROUP_SIZE));
        pass.end();

        // Encode a command to copy the results to a mappable buffer.
        encoder.copyBufferToBuffer(bodiesB, 0, resultBuffer, 0, resultBuffer.size);

        // Finish encoding and submit the commands
        const commandBuffer = encoder.finish();
        device.queue.submit([commandBuffer]);

        // Read the results
        await resultBuffer.mapAsync(GPUMapMode.READ);
        const result = new Float32Array(resultBuffer.getMappedRange());

        // console.log('input', input);
        // console.log('result', result);
        function logBody(i: number) {
            const index = i * 5;
            const x = result[index + 0].toFixed(3);
            const y = result[index + 1].toFixed(3);
            const x_vel = result[index + 2].toFixed(3);
            const y_vel = result[index + 3].toFixed(3);
            const msg =
                `[${i}]:\n\tpos: ${x}\t${y}\tvel: ${x_vel}\t${y_vel}`;
            console.log(msg);
        }
        logBody(0);
        logBody(1);
        console.log('------------------------');
        resultBuffer.unmap();

        if (runCount < MAX_RUN_COUNT) {
            if (bindGroup === bindGroupA) {
                bindGroup = bindGroupB;
                outputBuffer = bodiesA;
            } else {
                bindGroup = bindGroupA;
                outputBuffer = bodiesB;
            }
            requestAnimationFrame(run);
        }
    }
    requestAnimationFrame(run);
}
main();
