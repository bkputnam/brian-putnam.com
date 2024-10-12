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

    // Bind some data to ARRAY_BUFFER
    var positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    // three 2d points
    var positions = [
        0, 0,
        0, 0.5,
        0.7, 0,
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

    // Bind the attribute/buffer set we want.
    gl.bindVertexArray(vao);

    var primitiveType = gl.TRIANGLES;
    var offset = 0;
    var count = 3;
    gl.drawArrays(primitiveType, offset, count);
}
main();