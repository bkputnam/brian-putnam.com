import { createProgram, resizeCanvasToDisplaySize, runProgramWithData } from "./bkpgl/lib.js";

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

        drawMode: gl.POINTS,
        rasterizerDiscard: true,

        attributes: {
            a: {
                size: 1,
                type: gl.FLOAT,
                normalize: false,
                stride: 0,
                offset: 0,
                target: gl.ARRAY_BUFFER,
                usage: gl.STATIC_DRAW,
            },
            b: {
                size: 1,
                type: gl.FLOAT,
                normalize: false,
                stride: 0,
                offset: 0,
                target: gl.ARRAY_BUFFER,
                usage: gl.STATIC_DRAW,
            },
        },

        transformFeedback: {
            bufferMode: gl.SEPARATE_ATTRIBS,
            varyingConfigs: [
                {
                    name: 'sum',
                    length: 6,
                    type: Float32Array
                },
                {
                    name: 'difference',
                    length: 6,
                    type: Float32Array
                },
                {
                    name: 'product',
                    length: 6,
                    type: Float32Array
                }
            ]
        },
    });

    resizeCanvasToDisplaySize(gl.canvas);
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    const { transformFeedback } = runProgramWithData(program, {
        attributes: {
            a: new Float32Array([1, 2, 3, 4, 5, 6]),
            b: new Float32Array([3, 6, 9, 12, 15, 18]),
        },
        uniforms: {},
    });

    for (const buf of transformFeedback.buffers) {
        console.log(buf);
    }
}
main();