import { fail } from "./fail.js";
import * as bkp from "./bkplib.js";

const NUM_BODIES = 2;

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
    const device = await adapter?.requestDevice();
    if (!device) {
        fail('fail-msg');
        return;
    }

    const module = device.createShaderModule({
        label: 'nbody compute module',
        code: await bkp.loadShaderSource('nbody_compute.wgsl'),
    });

    // const pipeline = device.createComputePipeline({
    //     label: 'doubling compute pipeline',
    //     layout: 'auto',
    //     compute: {
    //         module,
    //     },
    // });

    // const input = new Float32Array([
    //     ...body({ x: 1, y: 0, x_vel: 0, y_vel: -1, mass: 1 }),
    //     ...body({ x: -1, y: 0, x_vel: 0, y_vel: 1, mass: 1 })
    // ]);
    // const bodiesA = device.createBuffer({
    //     label: 'input buffer',
    //     size: input.byteLength,
    //     usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC | GPUBufferUsage.COPY_DST,
    // });
    // const bodiesB = device.createBuffer({
    //     label: 'input buffer',
    //     size: input.byteLength,
    //     usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC | GPUBufferUsage.COPY_DST,
    // });
    // // Copy our input data to that buffer
    // device.queue.writeBuffer(bodiesA, 0, input);

    // // create a buffer on the GPU to get a copy of the results
    // const resultBuffer = device.createBuffer({
    //     label: 'result buffer',
    //     size: input.byteLength,
    //     usage: GPUBufferUsage.MAP_READ | GPUBufferUsage.COPY_DST
    // });

    // // Setup a bindGroup to tell the shader which
    // // buffer to use for the computation
    // const bindGroup = device.createBindGroup({
    //     label: 'bindGroup for work buffer',
    //     layout: pipeline.getBindGroupLayout(0),
    //     entries: [
    //         { binding: 0, resource: { buffer: workBuffer } },
    //     ],
    // });

    // // Encode commands to do the computation
    // const encoder = device.createCommandEncoder({
    //     label: 'doubling encoder',
    // });
    // const pass = encoder.beginComputePass({
    //     label: 'doubling compute pass',
    // });
    // pass.setPipeline(pipeline);
    // pass.setBindGroup(0, bindGroup);
    // pass.dispatchWorkgroups(input.length);
    // pass.end();

    // // Encode a command to copy the results to a mappable buffer.
    // encoder.copyBufferToBuffer(workBuffer, 0, resultBuffer, 0, resultBuffer.size);

    // // Finish encoding and submit the commands
    // const commandBuffer = encoder.finish();
    // device.queue.submit([commandBuffer]);

    // // Read the results
    // await resultBuffer.mapAsync(GPUMapMode.READ);
    // const result = new Float32Array(resultBuffer.getMappedRange());

    // console.log('input', input);
    // console.log('result', result);

    // resultBuffer.unmap();
}
main();
