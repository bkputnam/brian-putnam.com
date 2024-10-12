import { createProgram, createShader, loadShaderSource } from "./bkp_gl.js";
import * as webglUtils from "./webgl_utils.js";

async function main() {
    const canvas = document.querySelector("#c")! as HTMLCanvasElement;
    const gl = canvas.getContext("webgl2");
    if (!gl) {
        throw new Error('No GL for you!');
    }
    webglUtils.registerCanvas(canvas);

    const [vertexShaderSource, fragmentShaderSource] = await Promise.all([
        loadShaderSource('./vert.glsl'),
        loadShaderSource('./frag.glsl'),
    ]);

    // Create shader program
    const vertexShader =
        createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
    const fragmentShader =
        createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);
    const program = createProgram(gl, vertexShader, fragmentShader);

    var positionAttributeLocation = gl.getAttribLocation(program, "a_position");
    var resolutionUniformLocation = gl.getUniformLocation(program, "u_resolution");
    var colorLocation = gl.getUniformLocation(program, "u_color");

    // Bind some data to ARRAY_BUFFER
    var positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    // three 2d points
    var positions = [
        10, 20,
        80, 20,
        10, 30,
        10, 30,
        80, 20,
        80, 30,
    ];
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

    var vao = gl.createVertexArray();
    gl.bindVertexArray(vao);
    gl.enableVertexAttribArray(positionAttributeLocation);
    gl.vertexAttribPointer(
        positionAttributeLocation,
        /* size= */ 2,          // 2 components per iteration
        /* type= */ gl.FLOAT,   // the data is 32bit floats
        /* normalize= */ false, // don't normalize the data
        /* stride= */ 0,        // 0 = move forward size * sizeof(type) each
                                // iteration to get the next position
        /* offset= */ 0);       // start at the beginning of the buffer

    // Resize the canvas to match its displayed size, and then update the
    // GL viewport to be the whole canvas
    webglUtils.resizeCanvasToDisplaySize(gl.canvas);
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

    // Clear the canvas
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    // Tell it to use our program (pair of shaders)
    gl.useProgram(program);

    // Pass in the canvas resolution so we can convert from
    // pixels to clip space in the shader
    gl.uniform2f(resolutionUniformLocation, gl.canvas.width, gl.canvas.height);

    // Bind the attribute/buffer set we want.
    gl.bindVertexArray(vao);

    // var primitiveType = gl.TRIANGLES;
    // var offset = 0;
    // var count = 6;
    // gl.drawArrays(primitiveType, offset, count);

    const MIN_RECT_WIDTH = 10;
    const MAX_RECT_WIDTH = 300;

    // draw 50 random rectangles in random colors
    for (var ii = 0; ii < 50; ++ii) {
        // Setup a random rectangle
        const width = randomInt(MIN_RECT_WIDTH, MAX_RECT_WIDTH);
        const height = randomInt(MIN_RECT_WIDTH, MAX_RECT_WIDTH);
        const x = randomInt(0, gl.canvas.width - width);
        const y = randomInt(0, gl.canvas.height - height);
        setRectangle(gl, x, y, width, height);

        // Set a random color.
        gl.uniform4f(
            colorLocation, Math.random(), Math.random(), Math.random(), 1);

        // Draw the rectangle.
        var primitiveType = gl.TRIANGLES;
        var offset = 0;
        var count = 6;
        gl.drawArrays(primitiveType, offset, count);
    }
}

// Returns a random integer from 0 to range - 1.
function randomInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min) + min);
}

// Fills the buffer with the values that define a rectangle.

function setRectangle(
    gl: WebGL2RenderingContext,
    x: number,
    y: number,
    width: number,
    height: number) {
    var x1 = x;
    var x2 = x + width;
    var y1 = y;
    var y2 = y + height;

    // NOTE: gl.bufferData(gl.ARRAY_BUFFER, ...) will affect
    // whatever buffer is bound to the `ARRAY_BUFFER` bind point
    // but so far we only have one buffer. If we had more than one
    // buffer we'd want to bind that buffer to `ARRAY_BUFFER` first.

    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
        x1, y1,
        x2, y1,
        x1, y2,
        x1, y2,
        x2, y1,
        x2, y2]), gl.STATIC_DRAW);
}

main();

