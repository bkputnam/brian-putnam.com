
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

let do_record_calls = false;

function logGlCall(gl: GL2, fnName: string, args: any[]) {
    const enumRef = getGlEnumReference(gl);
    const argStr = [
        `gl.${fnName}(`,
        ...args.map((arg) => {
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
}

function recordGlCalls(gl: GL2) {
    for (const key in gl) {
        const val = (gl as any)[key];
        if (typeof val == "function") {
            const wrapper = function () {
                if (do_record_calls) {
                    logGlCall(gl, key, [...arguments]);
                }
                return val.apply(this, arguments);
            };
            (gl as any)[key] = wrapper;
        }
    }
}

function framebufferStatusToString(gl: GL2, status: GLenum): string {
    switch (status) {
        case gl.FRAMEBUFFER_COMPLETE:
            return 'FRAMEBUFFER_COMPLETE'
        case gl.FRAMEBUFFER_INCOMPLETE_ATTACHMENT:
            return 'FRAMEBUFFER_INCOMPLETE_ATTACHMENT';
        case gl.FRAMEBUFFER_INCOMPLETE_MISSING_ATTACHMENT:
            return 'FRAMEBUFFER_INCOMPLETE_MISSING_ATTACHMENT';
        case gl.FRAMEBUFFER_INCOMPLETE_DIMENSIONS:
            return 'FRAMEBUFFER_INCOMPLETE_DIMENSIONS';
        case gl.FRAMEBUFFER_UNSUPPORTED:
            return 'FRAMEBUFFER_UNSUPPORTED';
        default:
            return `Unknown status: ${status}`;
    }
}

function enableExtensions(gl: GL2, extensions: string[]) {
    for (const ext of extensions) {
        const result = gl.getExtension(ext);
        if (!result) {
            throw new Error(`Failed to enable GL extension "${ext}"`);
        }
    }
}

async function main() {
    const canvas = document.getElementById('c') as HTMLCanvasElement;
    const gl = canvas.getContext('webgl2', {
        preserveDrawingBuffer: true
    });
    if (!gl) {
        throw new Error('No WebGL for you!');
    }
    recordGlCalls(gl);
    enableExtensions(gl, [
        "EXT_color_buffer_float",
        "EXT_float_blend",
    ]);

    gl.disable(gl.DEPTH_TEST);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    twgl.resizeCanvasToDisplaySize(canvas, window.devicePixelRatio);
    gl.viewport(0, 0, canvas.width, canvas.height);

    const shaderSrcs = await bkp.loadShaderSources(
        'nbody_compute.vert', 'nbody_compute.frag');
    const programInfo = twgl.createProgramInfo(gl, shaderSrcs, {
        transformFeedbackVaryings: [
            'x', 'y', 'x_vel', 'y_vel'
        ],
    });
    const defaultDims = bkp.dimsForLen(gl, NUM_BODIES);
    const { textures, texturesReady } = bkp.createTextures(gl, {
        masses: bkp.makeFloatTexture(gl, defaultDims, gl.R32F, [1, 1]),

        x_positions_a: bkp.makeFloatTexture(gl, defaultDims, gl.R32F, [1, -1]),
        y_positions_a: bkp.makeFloatTexture(gl, defaultDims, gl.R32F, [0, 0]),
        x_velocities_a: bkp.makeFloatTexture(gl, defaultDims, gl.R32F, [0, 0]),
        y_velocities_a: bkp.makeFloatTexture(gl, defaultDims, gl.R32F, [-1, 1]),

        x_positions_b: bkp.makeFloatTexture(gl, defaultDims, gl.R32F),
        y_positions_b: bkp.makeFloatTexture(gl, defaultDims, gl.R32F),
        x_velocities_b: bkp.makeFloatTexture(gl, defaultDims, gl.R32F),
        y_velocities_b: bkp.makeFloatTexture(gl, defaultDims, gl.R32F),
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
        'masses': textures.masses,
        'x_positions_in': textures.x_positions_a,
        'y_positions_in': textures.y_positions_a,
        'x_velocities_in': textures.x_velocities_a,
        'y_velocities_in': textures.y_velocities_a,
    });

    const attachments = [
        { attachment: textures.x_positions_b },
        { attachment: textures.y_positions_b },
        { attachment: textures.x_velocities_b },
        { attachment: textures.y_velocities_b },
    ];
    const fbi = twgl.createFramebufferInfo(gl, attachments);
    const fbStatus = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
    const fbStatusStr = framebufferStatusToString(gl, fbStatus);
    // check if you can read from this type of texture.
    const canRead = (fbStatus == gl.FRAMEBUFFER_COMPLETE);
    if (!canRead) {
        throw new Error(`Cannot read: fbStatus = ${fbStatusStr}`);
    }
    console.log(`Success: fbStatus = ${fbStatusStr}`);
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbi.framebuffer); // Draw to framebuffer.
    gl.viewport(0, 0, defaultDims.width, defaultDims.height);


    // gl.bindTransformFeedback(gl.TRANSFORM_FEEDBACK, tf);
    // gl.beginTransformFeedback(gl.POINTS);
    twgl.drawBufferInfo(gl, tfBufferInfo, gl.POINTS);
    // gl.endTransformFeedback();
    // gl.bindTransformFeedback(gl.TRANSFORM_FEEDBACK, null);

    // await bkp.sync(gl);

    // twgl.setUniforms({
    //     'x_positions_in': textures.x_positions_a,
    //     'y_positions_in': textures.y_positions_a,
    //     'x_velocities_in': textures.x_velocities_a,
    //     'y_velocities_in': textures.y_velocities_a,
    // })

    // const tfInfos = programInfo.transformFeedbackInfo!;
    // for (const [name, tfInfo] of Object.entries(tfInfos)) {
    //     const bufferInfo = tfBufferInfo.attribs![name]!
    //     const buffer: WebGLBuffer = bufferInfo.buffer;
    //     const results = new Float32Array(NUM_BODIES);
    //     gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    //     gl.getBufferSubData(gl.ARRAY_BUFFER, 0, results);
    //     console.log(name, results);
    // }
    // gl.bindBuffer(gl.ARRAY_BUFFER, null);

    // // // get the result
    // // const results = new Uint8Array(dstWidth * dstHeight * 4);
    // // gl.readPixels(0, 0, dstWidth, dstHeight, gl.RGBA, gl.UNSIGNED_BYTE, results);

    // // // print the results
    // // for (let i = 0; i < dstWidth * dstHeight; ++i) {
    // //     log(results[i * 4]);
    // // }

    const x_pos = new Float32Array(defaultDims.width * defaultDims.height * 4);
    gl.readBuffer(gl.COLOR_ATTACHMENT0);
    gl.readPixels(0, 0, defaultDims.width, defaultDims.height, gl.RGBA, gl.FLOAT, x_pos);
    console.log(`x_pos: ${x_pos}`);

    const y_pos = new Float32Array(defaultDims.width * defaultDims.height * 4);
    gl.readBuffer(gl.COLOR_ATTACHMENT1);
    gl.readPixels(0, 0, defaultDims.width, defaultDims.height, gl.RGBA, gl.FLOAT, y_pos);
    console.log(`y_pos: ${y_pos}`);

    const x_vel = new Float32Array(defaultDims.width * defaultDims.height * 4);
    gl.readBuffer(gl.COLOR_ATTACHMENT2);
    gl.readPixels(0, 0, defaultDims.width, defaultDims.height, gl.RGBA, gl.FLOAT, x_vel);
    console.log(`x_vel: ${x_vel}`);

    const y_vel = new Float32Array(defaultDims.width * defaultDims.height * 4);
    gl.readBuffer(gl.COLOR_ATTACHMENT3);
    gl.readPixels(0, 0, defaultDims.width, defaultDims.height, gl.RGBA, gl.FLOAT, y_vel);
    console.log(`y_vel: ${y_vel}`);

    for (let i = 0; i < NUM_BODIES; i++) {
        const index = i * 4;
        const x = x_pos[index];
        const y = y_pos[index];
        const x_v = x_vel[index];
        const y_v = y_vel[index];
        console.log(`x: ${x}, y: ${y}, x_vel: ${x_v}, y_vel: ${y_v}`);
    }
}
main();