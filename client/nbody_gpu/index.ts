import { fail } from "./fail.js";
import * as bkp from "./bkplib.js";
import { Swapper } from "./swapper.js";
import { initBodies, MAX_RADIUS, NUM_BODIES } from "./populate_data.js";
import { COMPUTE_UNIFORM_ALIGNER, RENDER_UNIFORM_ALIGNER } from "./uniforms.js";

const WORKGROUP_SIZE = 64;
const DELTA_T = 0.005;

const RADIUS_WITH_PADDING = MAX_RADIUS * 0.5;
const viewportMinXy = [-RADIUS_WITH_PADDING, -RADIUS_WITH_PADDING];
const viewportMaxXy = [RADIUS_WITH_PADDING, RADIUS_WITH_PADDING];

interface SwapGroup {
    renderBindGroup: GPUBindGroup,
    renderUniforms: GPUBuffer,

    computeBindGroup: GPUBindGroup,
    computeUniforms: GPUBuffer,
}

function createBindGroups(
    device: GPUDevice,
    renderPipeline: GPURenderPipeline,
    computePipeline: GPUComputePipeline,
    bodies: Float32Array,
): Swapper<SwapGroup> {
    const bodiesA = device.createBuffer({
        label: 'bodiesA',
        size: bodies.byteLength,
        usage: GPUBufferUsage.STORAGE |
            GPUBufferUsage.COPY_SRC | GPUBufferUsage.COPY_DST,
    });
    const bodiesB = device.createBuffer({
        label: 'bodiesB',
        size: bodies.byteLength,
        usage: GPUBufferUsage.STORAGE |
            GPUBufferUsage.COPY_SRC | GPUBufferUsage.COPY_DST,
    });
    // Copy our input data to that buffer
    device.queue.writeBuffer(bodiesA, 0, bodies);
    // Note: we also have to write to bodiesB so that it has `mass` populated,
    // since we don't copy that back and forth
    device.queue.writeBuffer(bodiesB, 0, bodies);

    const computeUniformBuffer = device.createBuffer({
        label: 'compute uniform buffer',
        size: COMPUTE_UNIFORM_ALIGNER.byteSize,
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });
    COMPUTE_UNIFORM_ALIGNER.set('numBodies', NUM_BODIES);
    COMPUTE_UNIFORM_ALIGNER.set('deltaT', DELTA_T);
    device.queue.writeBuffer(
        computeUniformBuffer, 0, COMPUTE_UNIFORM_ALIGNER.arrayBuffer);

    const computeBindGroupA = device.createBindGroup({
        label: 'nbody compute BindGroup A',
        layout: computePipeline.getBindGroupLayout(0),
        entries: [
            // bodiesIn
            { binding: 0, resource: { buffer: bodiesA } },
            // bodiesOut
            { binding: 1, resource: { buffer: bodiesB } },
            // computeUniforms
            { binding: 2, resource: { buffer: computeUniformBuffer } },
        ],
    });
    const computeBindGroupB = device.createBindGroup({
        label: 'nbody compute BindGroup B',
        layout: computePipeline.getBindGroupLayout(0),
        entries: [
            // bodiesIn
            { binding: 0, resource: { buffer: bodiesB } },
            // bodiesOut
            { binding: 1, resource: { buffer: bodiesA } },
            // uniforms
            { binding: 2, resource: { buffer: computeUniformBuffer } },
        ],
    });

    const renderUniformsBuffer = device.createBuffer({
        label: 'render uniform buffer',
        size: 4 * 2 // viewportMinXy: vec2f
            + 4 * 2 // viewportMaxXy: vec2f
        ,
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });
    const renderUniformArrayBuffer =
        new ArrayBuffer(renderUniformsBuffer.size);
    const floats = new Float32Array(renderUniformArrayBuffer, 0, 4);
    floats.set([...viewportMinXy, ...viewportMaxXy], 0);
    device.queue.writeBuffer(
        renderUniformsBuffer, 0, renderUniformArrayBuffer);

    const renderBindGroupA = device.createBindGroup({
        label: 'nbody render BindGroup A',
        layout: renderPipeline.getBindGroupLayout(0),
        entries: [
            // bodiesIn
            { binding: 0, resource: { buffer: bodiesA } },
            // renderUniforms
            { binding: 3, resource: { buffer: renderUniformsBuffer } },
        ]
    });
    const renderBindGroupB = device.createBindGroup({
        label: 'nbody render BindGroup B',
        layout: renderPipeline.getBindGroupLayout(0),
        entries: [
            // bodiesIn
            { binding: 0, resource: { buffer: bodiesB } },
            // renderUniforms
            { binding: 3, resource: { buffer: renderUniformsBuffer } },
        ]
    });

    return new Swapper<SwapGroup>(
        {
            renderBindGroup: renderBindGroupA,
            renderUniforms: renderUniformsBuffer,

            computeBindGroup: computeBindGroupA,
            computeUniforms: computeUniformBuffer,
        },
        {
            renderBindGroup: renderBindGroupB,
            renderUniforms: renderUniformsBuffer,

            computeBindGroup: computeBindGroupB,
            computeUniforms: computeUniformBuffer,
        }
    );
}

async function main() {
    const shaderPromise = bkp.loadShaderSource('nbody_compute.wgsl');

    const adapter = await navigator.gpu?.requestAdapter();
    const maybeDevice = await adapter?.requestDevice();
    if (!maybeDevice) {
        fail('fail-msg');
        return;
    }
    // Using two variables like this prevents some compiler errors below
    const device = maybeDevice;

    const canvas = document.getElementById('the-canvas') as HTMLCanvasElement;
    const context = canvas.getContext('webgpu')!;
    const presentationFormat = navigator.gpu.getPreferredCanvasFormat()
    context?.configure({
        device,
        format: presentationFormat,
        alphaMode: 'premultiplied',
    });

    const shaderSrc = await shaderPromise;
    const module = device.createShaderModule({
        label: 'nbody compute module',
        code: shaderSrc,
    });

    const renderPipeline = device.createRenderPipeline({
        label: 'nbody compute pipeline',
        layout: 'auto',
        vertex: {
            module
        },
        fragment: {
            module,
            targets: [{
                format: presentationFormat,
                blend: {
                    color: {
                        srcFactor: 'one',
                        dstFactor: 'one-minus-src-alpha'
                    },
                    alpha: {
                        srcFactor: 'one',
                        dstFactor: 'one-minus-src-alpha'
                    },
                }
            }],
        },
        primitive: {
            topology: 'point-list',
        },
    });
    const computePipeline = device.createComputePipeline({
        label: 'nbody compute pipeline',
        layout: 'auto',
        compute: {
            module,
        },
    });

    const bodies = initBodies(NUM_BODIES);
    const swapper =
        createBindGroups(
            device,
            renderPipeline,
            computePipeline,
            bodies);

    async function run() {
        // Encode commands to do the computation
        const encoder = device.createCommandEncoder({
            label: 'nbody encoder',
        });

        RENDER_UNIFORM_ALIGNER.set('viewportMinXy', ...viewportMinXy);
        RENDER_UNIFORM_ALIGNER.set('viewportMaxXy', ...viewportMaxXy);
        device.queue.writeBuffer(
            swapper.get().renderUniforms,
            0,
            RENDER_UNIFORM_ALIGNER.arrayBuffer);

        const renderPass = encoder.beginRenderPass({
            label: 'nbody render pass',
            colorAttachments: [
                {
                    view: context.getCurrentTexture().createView(),
                    clearValue: [0, 0, 0, 1],
                    loadOp: 'clear',
                    storeOp: 'store',
                },
            ],
        });
        renderPass.setPipeline(renderPipeline);
        renderPass.setBindGroup(0, swapper.get().renderBindGroup);
        renderPass.draw(NUM_BODIES);
        renderPass.end();

        const computePass = encoder.beginComputePass({
            label: 'nbody compute pass',
        });
        computePass.setPipeline(computePipeline);
        computePass.setBindGroup(0, swapper.get().computeBindGroup);
        computePass.dispatchWorkgroups(Math.ceil(NUM_BODIES / WORKGROUP_SIZE));
        computePass.end();

        // Finish encoding and submit the commands
        const commandBuffer = encoder.finish();
        device.queue.submit([commandBuffer]);

        swapper.swap();
        requestAnimationFrame(run);
    }
    requestAnimationFrame(run);

    // Make sure the canvas fits the screen, and continues to do so if the page
    // is resized.
    const observer = new ResizeObserver(entries => {
        for (const entry of entries) {
            const canvas = entry.target as HTMLCanvasElement;
            const width = entry.contentBoxSize[0].inlineSize;
            const height = entry.contentBoxSize[0].blockSize;
            canvas.width = Math.max(
                1,
                Math.min(width, device.limits.maxTextureDimension2D));
            canvas.height = Math.max(
                1,
                Math.min(height, device.limits.maxTextureDimension2D));

            const aspectRatio = width / height;
            if (aspectRatio < 1) {
                const worldHeight = RADIUS_WITH_PADDING * (height / width);
                viewportMinXy[0] = -RADIUS_WITH_PADDING;
                viewportMinXy[1] = -worldHeight;
                viewportMaxXy[0] = RADIUS_WITH_PADDING;
                viewportMaxXy[1] = worldHeight;
            } else {
                const worldWidth = RADIUS_WITH_PADDING * (width / height);
                viewportMinXy[0] = -worldWidth;
                viewportMinXy[1] = -RADIUS_WITH_PADDING;
                viewportMaxXy[0] = worldWidth;
                viewportMaxXy[1] = RADIUS_WITH_PADDING;
            }
        }
    });
    observer.observe(canvas);
}
main();
