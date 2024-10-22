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
