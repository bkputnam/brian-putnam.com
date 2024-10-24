import { fail } from "./fail.js";
import * as bkp from "./bkplib.js";
import { Swapper } from "./swapper.js";

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

interface SwapGroup {
    bindGroup: GPUBindGroup,
    outputBuffer: GPUBuffer,
}

function createBindGroups(
    device: GPUDevice,
    pipeline: GPUPipelineBase,
    bodies: Float32Array):
    Swapper<SwapGroup> {
    const bodiesA = device.createBuffer({
        label: 'bodiesA',
        size: bodies.byteLength,
        usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC | GPUBufferUsage.COPY_DST,
    });
    const bodiesB = device.createBuffer({
        label: 'bodiesB',
        size: bodies.byteLength,
        usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC | GPUBufferUsage.COPY_DST,
    });
    // Copy our input data to that buffer
    device.queue.writeBuffer(bodiesA, 0, bodies);
    // Note: we also have to write to bodiesB so that it has `mass` populated,
    // since we don't copy that back and forth
    device.queue.writeBuffer(bodiesB, 0, bodies);

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

    const bindGroupA = device.createBindGroup({
        label: 'bindGroup for nbody computation',
        layout: pipeline.getBindGroupLayout(0),
        entries: [
            { binding: 0, resource: { buffer: bodiesA } }, // bodies_in
            { binding: 1, resource: { buffer: bodiesB } }, // bodies_out
            { binding: 2, resource: { buffer: uniformBuffer } }, // uniforms
        ],
    });
    const bindGroupB = device.createBindGroup({
        label: 'bindGroup for nbody computation',
        layout: pipeline.getBindGroupLayout(0),
        entries: [
            { binding: 0, resource: { buffer: bodiesB } }, // bodies_in
            { binding: 1, resource: { buffer: bodiesA } }, // bodies_out
            { binding: 2, resource: { buffer: uniformBuffer } }, // uniforms
        ],
    });

    return new Swapper<SwapGroup>(
        {
            bindGroup: bindGroupA,
            outputBuffer: bodiesB,
        },
        {
            bindGroup: bindGroupB,
            outputBuffer: bodiesA,
        }
    );
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

    const bodies = new Float32Array([
        ...body({ x: 1, y: 0, x_vel: 0, y_vel: -1, mass: 1 }),
        ...body({ x: -1, y: 0, x_vel: 0, y_vel: 1, mass: 1 })
    ]);
    const swapper = createBindGroups(device, pipeline, bodies);

    // create a buffer on the GPU to get a copy of the results
    const resultBuffer = device.createBuffer({
        label: 'result buffer',
        size: bodies.byteLength,
        usage: GPUBufferUsage.MAP_READ | GPUBufferUsage.COPY_DST
    });

    let runCount = 0;
    const MAX_RUN_COUNT = 4;
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
        pass.setBindGroup(0, swapper.get().bindGroup);
        pass.dispatchWorkgroups(Math.ceil(NUM_BODIES / WORKGROUP_SIZE));
        pass.end();

        // Encode a command to copy the results to a mappable buffer.
        encoder.copyBufferToBuffer(
            swapper.get().outputBuffer, 0, resultBuffer, 0, resultBuffer.size);

        // Finish encoding and submit the commands
        const commandBuffer = encoder.finish();
        device.queue.submit([commandBuffer]);

        // Read the results
        await resultBuffer.mapAsync(GPUMapMode.READ);
        const result = new Float32Array(resultBuffer.getMappedRange());

        function logBody(i: number) {
            const index = i * 5;
            const format = (a: number): string => {
                const fixed = a.toFixed(3);
                return a < 0 ? fixed : ' ' + fixed;
            };
            const x = format(result[index + 0]);
            const y = format(result[index + 1]);
            const x_vel = format(result[index + 2]);
            const y_vel = format(result[index + 3]);
            const msg =
                `[${i}]: pos: ${x}\t${y}\tvel: ${x_vel}\t${y_vel}`;
            console.log(msg);
        }
        logBody(0);
        logBody(1);
        console.log('------------------------');
        resultBuffer.unmap();

        if (runCount < MAX_RUN_COUNT) {
            swapper.swap();
            requestAnimationFrame(run);
        }
    }
    requestAnimationFrame(run);
}
main();
