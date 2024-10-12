import * as webglUtils from "./webgl_utils.js";
import { createProgram, runProgramWithData, WebGL2ProgramConfig, WebGL2ProgramWrapper } from "./webgl2_wrapper.js";

async function main() {
    const canvas = document.querySelector("#c")! as HTMLCanvasElement;
    const gl = canvas.getContext("webgl2");
    if (!gl) {
        throw new Error('No GL for you!');
    }

    const program = await createProgram({
        gl,
        vertexShaderSourceUrl: './vert.glsl',
        fragmentShaderSourceUrl: './frag.glsl',

        drawMode: gl.TRIANGLES,

        attributes: {
            a_position: {
                size: 2,
                type: gl.FLOAT,
                normalize: false,
                stride: 0,
                offset: 0,
                target: gl.ARRAY_BUFFER,
                usage: gl.STATIC_DRAW,
            }
        },

        uniforms: {
            u_resolution: 'uniform2f',
            u_color: 'uniform4f',
        },
    });

    webglUtils.resizeCanvasToDisplaySize(gl.canvas);
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

    // Clear the canvas
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    for (let i = 0; i < 50; i++) {
        runProgramWithData(program, {
            attributes: {
                a_position: randRectangleCoords(program),
            },

            uniforms: {
                u_resolution: [gl.canvas.width, gl.canvas.height],
                u_color: [Math.random(), Math.random(), Math.random(), 1],
            }
        });
    }
}
main();

// Returns a random integer from 0 to range - 1.
function randomInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min) + min);
}

// Fills the buffer with the values that define a rectangle.
const MIN_RECT_WIDTH = 10;
const MAX_RECT_WIDTH = 300;
function randRectangleCoords<T extends WebGL2ProgramConfig>(
    program: WebGL2ProgramWrapper<T>): Float32Array {
    const gl = program.config.gl;

    const width = randomInt(MIN_RECT_WIDTH, MAX_RECT_WIDTH);
    const height = randomInt(MIN_RECT_WIDTH, MAX_RECT_WIDTH);
    const x = randomInt(0, gl.canvas.width - width);
    const y = randomInt(0, gl.canvas.height - height);

    var x1 = x;
    var x2 = x + width;
    var y1 = y;
    var y2 = y + height;

    return new Float32Array([
        x1, y1,
        x2, y1,
        x1, y2,
        x1, y2,
        x2, y1,
        x2, y2
    ]);
}