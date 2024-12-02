type GL = WebGLRenderingContext;
type GL2 = WebGL2RenderingContext;

export async function loadShaderSource(url: string): Promise<string> {
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Response status: ${response.status}`);
    }

    const result = await response.text();
    return result;
}


export function observeResizes(canvas: HTMLCanvasElement, device: GPUDevice) {
    const observer = new ResizeObserver(entries => {
        for (const entry of entries) {
            const width = entry.contentBoxSize[0].inlineSize;
            const height = entry.contentBoxSize[0].blockSize;
            const canvas = entry.target as HTMLCanvasElement;
            canvas.width = Math.max(
                1, Math.min(width, device.limits.maxTextureDimension2D));
            canvas.height = Math.max(
                1, Math.min(height, device.limits.maxTextureDimension2D));
        }
    });
    observer.observe(canvas);
}