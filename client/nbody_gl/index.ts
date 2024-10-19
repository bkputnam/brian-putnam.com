
import * as bkp from './bkplib.js';
import * as twgl from "./twgl/twgl-full.module.js";

type GL = WebGLRenderingContext;
type GL2 = WebGL2RenderingContext;

const NUM_BODIES = 2;

let glEnumReference: Map<number, string> | null = null;

function getGlEnumReference(gl: GL2): Map<number, string> {
    if (!glEnumReference) {
        glEnumReference = new Map<number, string>();
        const glAny = gl as any;
        for (const key in gl) {
            const val = glAny[key];
            if (typeof val == 'number') {
                glEnumReference.set(val, key);
            }
        }
    }
    return glEnumReference;
}

function recordGlCalls(gl: GL2) {
    const enumRef = getGlEnumReference(gl);
    for (const key in gl) {
        const val = (gl as any)[key];
        if (typeof val == "function") {
            const wrapper = function () {
                const argStr = [
                    `gl.${key}(`,
                    ...[...arguments].map((arg) => {
                        if (typeof arg == "string") {
                            const lines = arg.split('\n');
                            if (lines.length > 1) {
                                arg = lines[0] + '…';
                            }
                            if (arg.length > 20) {
                                arg = arg.substring(0, 20) + '…';
                            }
                            arg = `'${arg}'`;
                        } else if (typeof arg == 'number') {
                            if (enumRef.has(arg)) {
                                arg = `${arg} (${enumRef.get(arg)})`;
                            }
                        } else if (ArrayBuffer.isView(arg)) {
                            arg = Object.prototype.toString.call(arg) +
                                arg.toString();
                        } else if (typeof arg == 'object') {
                            arg = Object.prototype.toString.call(arg);
                        }
                        return `  ${arg},`;
                    }),
                    `)`]
                    .join('\n');
                console.debug(argStr);
                return val.apply(this, arguments);
            };
            (gl as any)[key] = wrapper;
        }
    }
}

async function main() {
    const canvas = document.getElementById('c') as HTMLCanvasElement;
    const gl = canvas.getContext('webgl2');
    if (!gl) {
        throw new Error('No WebGL for you!');
    }
    // recordGlCalls(gl);

    gl.disable(gl.DEPTH_TEST);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    twgl.resizeCanvasToDisplaySize(canvas, window.devicePixelRatio);
    gl.viewport(0, 0, canvas.width, canvas.height);

    const shaderSrcs = await bkp.loadShaderSources('nbody.vert', 'nbody.frag');
    const programInfo = twgl.createProgramInfo(gl, shaderSrcs, {
        transformFeedbackVaryings: [
            'x', 'y', 'x_vel', 'y_vel'
        ]
    });
    const defaultDims = bkp.dimsForLen(gl, NUM_BODIES);
    const { textures, texturesReady } = bkp.createTextures(gl, {
        masses: bkp.makeFloatTexture(gl, defaultDims),

        x_positions_a: bkp.makeFloatTexture(gl, defaultDims, [1, -1]),
        y_positions_a: bkp.makeFloatTexture(gl, defaultDims, [0, 0]),
        x_velocities_a: bkp.makeFloatTexture(gl, defaultDims, [0, 0]),
        y_velocities_a: bkp.makeFloatTexture(gl, defaultDims, [-1, 1]),

        x_positions_b: bkp.makeFloatTexture(gl, defaultDims),
        y_positions_b: bkp.makeFloatTexture(gl, defaultDims),
        x_velocities_b: bkp.makeFloatTexture(gl, defaultDims),
        y_velocities_b: bkp.makeFloatTexture(gl, defaultDims),
    });
    await texturesReady;

    // Clear the canvas
    gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);

    const tfBufferInfo = twgl.createBufferInfoFromArrays(gl, {
        x: { numComponents: 1, data: NUM_BODIES },
        y: { numComponents: 1, data: NUM_BODIES },
        x_vel: { numComponents: 1, data: NUM_BODIES },
        y_vel: { numComponents: 1, data: NUM_BODIES },
    });
    const tf = twgl.createTransformFeedback(gl, programInfo, tfBufferInfo);

    gl.useProgram(programInfo.program);

    twgl.setUniforms(programInfo, {
        'num_bodies': NUM_BODIES,
        'min_xy': [-2, -2],
        'max_xy': [2, 2],
        'delta_t': 0.1,
        'tex_size': [defaultDims.width, defaultDims.height],
        'x_positions_in': textures.x_positions_a,
        'y_positions_in': textures.y_positions_a,
        'x_velocities_in': textures.x_velocities_a,
        'y_velocities_in': textures.y_velocities_a,
    });
    gl.bindTransformFeedback(gl.TRANSFORM_FEEDBACK, tf);
    gl.beginTransformFeedback(gl.POINTS);
    twgl.drawBufferInfo(gl, tfBufferInfo, gl.POINTS);
    gl.endTransformFeedback();
    gl.bindTransformFeedback(gl.TRANSFORM_FEEDBACK, null);

    const tfInfos = programInfo.transformFeedbackInfo!;
    for (const [name, tfInfo] of Object.entries(tfInfos)) {
        const bufferInfo = tfBufferInfo.attribs![name]!
        const buffer: WebGLBuffer = bufferInfo.buffer;
        const results = new Float32Array(NUM_BODIES);
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        gl.getBufferSubData(gl.ARRAY_BUFFER, 0, results);
        console.log(name, results);
    }
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
}
main();