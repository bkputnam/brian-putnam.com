import { createProgram, resizeCanvasToDisplaySize, runProgramWithData } from "./bkpgl/lib.js";
import { TexImage2D_Signature1, TexImage2DConfig } from "./bkpgl/texture_config.js";
import { TypedArray } from "./bkpgl/typed_arrays.js";

const NUM_BODIES = 2;

function indices(len: number): number[] {
    const result = new Array(len);
    for (let i = 0; i < len; i++) {
        result[i] = i;
    }
    return result;
}

async function main() {
    const canvas = document.querySelector("#c")! as HTMLCanvasElement;
    const gl = canvas.getContext("webgl2", {
        premultipliedAlpha: false  // Ask for non-premultiplied alpha
    });
    if (!gl) {
        throw new Error('No GL for you!');
    }

    function makeFloatTexture(
        gl: WebGL2RenderingContext,
        name: string,
        pixels: number[]):
        TexImage2DConfig {
        if (pixels.length !== NUM_BODIES) {
            throw new Error('!= NUM_BODIES');
        }
        return {
            name,
            target: gl.TEXTURE_2D,
            level: 0,
            internalformat: gl.R32F,
            width: pixels.length,
            height: 1,
            type: gl.FLOAT,
            pixels: new Float32Array(pixels),
            textureParams: [
                {
                    type: 'texParameteri',
                    pname: gl.TEXTURE_MIN_FILTER,
                    param: gl.NEAREST,
                },
                {
                    type: 'texParameteri',
                    pname: gl.TEXTURE_MAG_FILTER,
                    param: gl.NEAREST,
                },
                {
                    type: 'texParameteri',
                    pname: gl.TEXTURE_WRAP_S,
                    param: gl.CLAMP_TO_EDGE,
                },
                {
                    type: 'texParameteri',
                    pname: gl.TEXTURE_WRAP_T,
                    param: gl.CLAMP_TO_EDGE,
                },
            ],
            unpackAlignment: 1,
        };
    }

    const program = await createProgram({
        gl,
        vertexShaderSourceUrl: './nbody.vert',
        fragmentShaderSourceUrl: './nbody.frag',

        drawMode: gl.POINTS,

        numVertexes: NUM_BODIES,

        uniforms: {
            'num_bodies': 'uniform1i',
            'min_xy': 'uniform2f',
            'max_xy': 'uniform2f',
            'delta_t': "uniform1f",
        },

        textures2D: {
            texImage2DConfig2: [
                makeFloatTexture(gl, 'x_positions', [1, -1]),
                makeFloatTexture(gl, 'y_positions', [0, 0]),
                makeFloatTexture(gl, 'masses', [1, 1]),
                makeFloatTexture(gl, 'x_velocities', [0, 0]),
                makeFloatTexture(gl, 'y_velocities', [-1, 1]),
            ],
        },

        transformFeedback: {
            bufferMode: gl.SEPARATE_ATTRIBS,
            varyingConfigs: [
                {
                    name: 'x',
                    length: NUM_BODIES,
                    type: Float32Array,
                },
                {
                    name: 'y',
                    length: NUM_BODIES,
                    type: Float32Array,
                },
                {
                    name: 'x_vel',
                    length: NUM_BODIES,
                    type: Float32Array,
                },
                {
                    name: 'y_vel',
                    length: NUM_BODIES,
                    type: Float32Array,
                },
            ]
        },
    });

    gl.disable(gl.DEPTH_TEST);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    resizeCanvasToDisplaySize(gl.canvas);
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

    // Clear the canvas
    gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);

    const { transformFeedback } = await runProgramWithData(program, {
        attributes: undefined,
        uniforms: {
            'num_bodies': 2,
            'min_xy': [-2, -2],
            'max_xy': [2, 2],
            'delta_t': 0.1,
        },
    });

    const tfConfig = program.config.transformFeedback;
    for (const [index, tfC] of tfConfig.varyingConfigs.entries()) {
        const name = tfC.name;
        const buf = transformFeedback.buffers[index];
        console.log(name, buf);
    }
}
main();