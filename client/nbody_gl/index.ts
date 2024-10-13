import { createShader, loadShaderSource } from "./webgl2_wrapper.js";

async function main() {
    const canvas = document.querySelector("#c")! as HTMLCanvasElement;
    const gl = canvas.getContext("webgl2");
    if (!gl) {
        throw new Error('No GL for you!');
    }

    const [vs, fs] = await Promise.all([
        loadShaderSource('./vert.glsl'),
        loadShaderSource('./frag.glsl'),
    ]);
    const vShader = createShader(gl, gl.VERTEX_SHADER, vs);
    const fShader = createShader(gl, gl.FRAGMENT_SHADER, fs);

    const program = gl.createProgram()!;
    gl.attachShader(program, vShader);
    gl.attachShader(program, fShader);
    gl.transformFeedbackVaryings(
        program,
        ['sum', 'difference', 'product'],
        gl.SEPARATE_ATTRIBS,
    );
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        throw new Error(gl.getProgramInfoLog(program)!);
    }

    const aLoc = gl.getAttribLocation(program, 'a');
    const bLoc = gl.getAttribLocation(program, 'b');

    const vao = gl.createVertexArray();
    gl.bindVertexArray(vao);

    function makeBuffer(
        gl: WebGL2RenderingContext,
        sizeOrData: AllowSharedBufferSource | number):
        WebGLBuffer {
        const buf = gl.createBuffer()!;
        gl.bindBuffer(gl.ARRAY_BUFFER, buf);
        gl.bufferData(
            gl.ARRAY_BUFFER,
            sizeOrData as any,
            gl.STATIC_DRAW);
        return buf;
    }

    function makeBufferAndSetAttribute(
        gl: WebGL2RenderingContext,
        data: AllowSharedBufferSource,
        loc: GLint) {
        const buf = makeBuffer(gl, data);
        gl.enableVertexAttribArray(loc);
        gl.vertexAttribPointer(
            loc,
            1, // size
            gl.FLOAT,
            false, // normalize
            0, // stride
            0. // offset
        );
    }

    const a = [1, 2, 3, 4, 5, 6];
    const b = [3, 6, 9, 12, 15, 18];

    const aBuffer = makeBufferAndSetAttribute(gl, new Float32Array(a), aLoc);
    const bBuffer = makeBufferAndSetAttribute(gl, new Float32Array(b), bLoc);

    const tf = gl.createTransformFeedback();
    gl.bindTransformFeedback(gl.TRANSFORM_FEEDBACK, tf);

    const sumBuffer = makeBuffer(gl, a.length * 4);
    const differenceBuffer = makeBuffer(gl, a.length * 4);
    const productBuffer = makeBuffer(gl, a.length * 4);

    gl.bindBufferBase(gl.TRANSFORM_FEEDBACK_BUFFER, 0, sumBuffer);
    gl.bindBufferBase(gl.TRANSFORM_FEEDBACK_BUFFER, 1, differenceBuffer);
    gl.bindBufferBase(gl.TRANSFORM_FEEDBACK_BUFFER, 2, productBuffer);

    // Clear buffers
    gl.bindTransformFeedback(gl.TRANSFORM_FEEDBACK, null);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);

    gl.useProgram(program);

    // Do we really need to do this again?
    // gl.bindVertexArray(vao);

    gl.enable(gl.RASTERIZER_DISCARD);

    gl.bindTransformFeedback(gl.TRANSFORM_FEEDBACK, tf);
    gl.beginTransformFeedback(gl.POINTS);
    gl.drawArrays(gl.POINTS, 0, a.length);
    gl.endTransformFeedback();
    gl.bindTransformFeedback(gl.TRANSFORM_FEEDBACK, null);

    gl.disable(gl.RASTERIZER_DISCARD);

    function getResults(
        gl: WebGL2RenderingContext,
        buffer: WebGLBuffer,
        label: string): Float32Array {
        const results = new Float32Array(a.length);
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        gl.getBufferSubData(
            gl.ARRAY_BUFFER,
            0,
            results);
        return results;
    }

    const sums = getResults(gl, sumBuffer, 'sums');
    const differences = getResults(gl, differenceBuffer, 'differences');
    const products = getResults(gl, differenceBuffer, 'products');

    console.log('a', a);
    console.log('b', b);
    console.log('sums', sums);
    console.log('differences', differences);
    console.log('products', products);
}
main();

