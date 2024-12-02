import * as bkp from "./bkplib.js";

async function main() {
    const shaderPromise = bkp.loadShaderSource('fractal.wgsl');

    const adapter = await navigator.gpu?.requestAdapter();
    const maybeDevice = await adapter?.requestDevice();
    if (!maybeDevice) {
        const message = `This device doesn't support WebGPU`;
        alert(message);
        throw new Error(message);
    }
    // Using two variables like this prevents some compiler errors below
    const device = maybeDevice;

    const canvas = document.getElementById('canvas') as HTMLCanvasElement;
    bkp.observeResizes(canvas, device);
    const context = canvas.getContext('webgpu')!;
    const presentationFormat = navigator.gpu.getPreferredCanvasFormat();
    context?.configure({
        device,
        format: presentationFormat,
        // alphaMode?
    });

    const shaderSrc = await shaderPromise;
    const module = device.createShaderModule({
        label: 'fractal shader',
        code: shaderSrc,
    });
    const renderPipeline = device.createRenderPipeline({
        label: 'fractal render pipeline',
        layout: 'auto',
        vertex: { module },
        fragment: {
            module,
            targets: [{
                format: presentationFormat,
            }],
        },
    });

    async function run() {
        const encoder = device.createCommandEncoder({
            label: 'nbody encoder',
        });
        const renderPass = encoder.beginRenderPass({
            label: 'fractal render pass',
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
        // 3 vertices needed to draw 1 triangle that fills the entire screen
        renderPass.draw(3);
        renderPass.end();
        const commandBuffer = encoder.finish();
        device.queue.submit([commandBuffer]);
        requestAnimationFrame(run);
    }
    requestAnimationFrame(run);
}
main();
