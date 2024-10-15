/**
 * Use ResizeObserver to get the most accurate sizing info for the canvas
 * element, to avoid rendering artifacts due to the browser scaling the webgl
 * output.
 * 
 * Copied and lightly tweaked from
 * https://webgl2fundamentals.org/webgl/lessons/webgl-resizing-the-canvas.html
 */

const resizeObserver = new ResizeObserver(onResize);
const canvasToDisplaySizeMap = new Map<HTMLCanvasElement, [number, number]>();

export function registerCanvas(canvas: HTMLCanvasElement | OffscreenCanvas) {
    if (canvas instanceof OffscreenCanvas) {
        return;
    }
    try {
        // only call us of the number of device pixels changed
        resizeObserver.observe(canvas, { box: 'device-pixel-content-box' });
    } catch (ex) {
        // device-pixel-content-box is not supported so fallback to this
        resizeObserver.observe(canvas, { box: 'content-box' });
    }

    // init with the default canvas size
    canvasToDisplaySizeMap.set(canvas, [canvas.width, canvas.height]);
}

function onResize(entries: ResizeObserverEntry[]) {
    for (const entry of entries) {
        let width;
        let height;
        let dpr = window.devicePixelRatio;
        if (entry.devicePixelContentBoxSize) {
            // NOTE: Only this path gives the correct answer
            // The other paths are imperfect fallbacks
            // for browsers that don't provide anyway to do this
            width = entry.devicePixelContentBoxSize[0].inlineSize;
            height = entry.devicePixelContentBoxSize[0].blockSize;
            dpr = 1; // it's already in width and height
        } else if (entry.contentBoxSize) {
            if (entry.contentBoxSize[0]) {
                width = entry.contentBoxSize[0].inlineSize;
                height = entry.contentBoxSize[0].blockSize;
            } else {
                width = (entry.contentBoxSize as any).inlineSize;
                height = (entry.contentBoxSize as any).blockSize;
            }
        } else {
            width = entry.contentRect.width;
            height = entry.contentRect.height;
        }
        const displayWidth = Math.round(width * dpr);
        const displayHeight = Math.round(height * dpr);
        const target = entry.target as HTMLCanvasElement;
        canvasToDisplaySizeMap.set(target, [displayWidth, displayHeight]);
    }
}

export function resizeCanvasToDisplaySize(
    canvas: HTMLCanvasElement | OffscreenCanvas) {
    if (canvas instanceof OffscreenCanvas) {
        return;
    }
    // Get the size the browser is displaying the canvas in device pixels.
    const dims = canvasToDisplaySizeMap.get(canvas);
    if (!dims) {
        throw new Error(
            'You must call registerCanvas(canvas) before calling ' +
            'resizeCanvasToDisplaySize(canvas)');
    }
    const [displayWidth, displayHeight] = dims;

    // Check if the canvas is not the same size.
    const needResize = canvas.width != displayWidth ||
        canvas.height != displayHeight;

    if (needResize) {
        // Make the canvas the same size
        canvas.width = displayWidth;
        canvas.height = displayHeight;
    }

    return needResize;
}
