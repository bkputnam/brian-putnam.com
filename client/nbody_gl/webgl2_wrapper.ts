import * as webglUtils from "./webgl_utils.js";

// This is just shorthand to make life easier
type gl = WebGLRenderingContextBase;
type gl2 = WebGL2RenderingContextBase;

export type AttributeType =
    // These types are available since WebGL1
    gl['BYTE'] | gl['SHORT'] | gl['UNSIGNED_BYTE'] | gl['UNSIGNED_SHORT'] |
    gl['FLOAT'] |
    // The rest of the types are exclusive to WebGL2
    gl['INT'] | gl['UNSIGNED_INT'] | gl2['HALF_FLOAT'] |
    gl2['INT_2_10_10_10_REV'] | gl2['UNSIGNED_INT_2_10_10_10_REV'];

export type AttributeTarget =
    gl['ARRAY_BUFFER'] |
    gl['ELEMENT_ARRAY_BUFFER'] |
    gl2['COPY_READ_BUFFER'] |
    gl2['COPY_WRITE_BUFFER'] |
    gl2['TRANSFORM_FEEDBACK_BUFFER'] |
    gl2['UNIFORM_BUFFER'] |
    gl2['PIXEL_PACK_BUFFER'] |
    gl2['PIXEL_UNPACK_BUFFER'];

export type AttributeUsage =
    gl['STATIC_DRAW'] |
    gl['DYNAMIC_DRAW'] |
    gl['STREAM_DRAW'] |
    gl2['STATIC_READ'] |
    gl2['DYNAMIC_READ'] |
    gl2['STREAM_READ'] |
    gl2['STATIC_COPY'] |
    gl2['DYNAMIC_COPY'] |
    gl2['STREAM_COPY'];

export type ShaderType = gl['VERTEX_SHADER'] | gl['FRAGMENT_SHADER'];

export type DrawArraysMode =
    gl['POINTS'] |
    gl['LINE_STRIP'] |
    gl['LINE_LOOP'] |
    gl['LINES'] |
    gl['TRIANGLE_STRIP'] |
    gl['TRIANGLE_FAN'] |
    gl['TRIANGLES'];

export interface WebGL2ProgramConfig {
    gl: WebGL2RenderingContext,
    vertexShaderSourceUrl: string,
    fragmentShaderSourceUrl: string,

    drawMode: DrawArraysMode,

    attributes: { [name: string]: AttributeConfig },
    uniforms: { [name: string]: UniformType },
};

export interface WebGL2ProgramWrapper<T extends WebGL2ProgramConfig> {
    config: T,
    program: WebGLProgram,
}

export interface WebGL2RunConfig<T extends WebGL2ProgramConfig> {
    offset?: GLint,
    count?: GLsizei,

    attributes: AttributeDataObj<T['attributes']>,
    uniforms: UniformDataObj<T['uniforms']>,
}

export interface AttributeConfig {
    size: 1 | 2 | 3 | 4,
    type: AttributeType,
    normalize: GLboolean,
    stride: GLsizei,
    offset: GLintptr,

    target: AttributeTarget,
    usage: AttributeUsage,
}

// Float16Array isn't widely supported at the time of this writing:
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Float16Array
type TypedArray =
    Int8Array | Uint8Array | Uint8ClampedArray | Int16Array | Uint16Array |
    Int32Array | Uint32Array /* | Float16Array */ | Float32Array |
    Float64Array | BigInt64Array | BigUint64Array;

export type SrcData =
    ArrayBuffer | SharedArrayBuffer | TypedArray | DataView;

export type AttributeDataObj<T extends { [name: string]: AttributeConfig }> = {
    [Property in keyof T]: SrcData;
};

export type UniformType = 'uniform1f' | 'uniform2f' | 'uniform3f' | 'uniform4f' |
    'uniform1i' | 'uniform2i' | 'uniform3i' | 'uniform4i';

export type UniformData<T extends UniformType> =
    T extends 'uniform1f' ? [GLfloat] :
    T extends 'uniform2f' ? [GLfloat, GLfloat] :
    T extends 'uniform3f' ? [GLfloat, GLfloat, GLfloat] :
    T extends 'uniform4f' ? [GLfloat, GLfloat, GLfloat, GLfloat] :
    T extends 'uniform1i' ? [GLint] :
    T extends 'uniform2i' ? [GLint, GLint] :
    T extends 'uniform3i' ? [GLint, GLint, GLint] :
    T extends 'uniform4i' ? [GLint, GLint, GLint, GLint] :
    never;

export type UniformDataObj<T extends { [name: string]: UniformType }> = {
    [Property in keyof T]: UniformData<T[Property]>;
};

async function loadShaderSource(url: string): Promise<string> {
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Response status: ${response.status}`);
    }

    const result = await response.text();
    return result;
}

function createShader(
    gl: WebGL2RenderingContext, type: ShaderType, source: string):
    WebGLShader {
    var shader = gl.createShader(type)!;
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    var success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
    if (success) {
        return shader;
    }

    console.log(gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    throw new Error(`Failed to create shader`);
}

export async function createProgram<T extends WebGL2ProgramConfig>(config: T):
    Promise<WebGL2ProgramWrapper<T>> {
    const gl = config.gl;
    webglUtils.registerCanvas(gl.canvas);
    const [vertexSource, fragmentSource]: string[] = await Promise.all([
        loadShaderSource(config.vertexShaderSourceUrl),
        loadShaderSource(config.fragmentShaderSourceUrl),
    ]);

    const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexSource);
    const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentSource);

    const program = gl.createProgram()!;
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    const success = gl.getProgramParameter(program, gl.LINK_STATUS);
    if (!success) {
        const errMsg = gl.getProgramInfoLog(program);
        gl.deleteProgram(program);
        throw new Error(`Failed to create progrem: ${errMsg}`);
    }

    const vao = gl.createVertexArray();
    gl.bindVertexArray(vao);

    return {
        config,
        program
    };
}

export function runProgramWithData<T extends WebGL2ProgramConfig>(
    programWrapper: WebGL2ProgramWrapper<T>,
    config: WebGL2RunConfig<T>) {
    const program = programWrapper.program;
    const gl = programWrapper.config.gl;

    // Tell it to use our program (pair of shaders)
    gl.useProgram(program);

    let count: number | undefined = config.count;

    for (const [name, data] of Object.entries(config.attributes)) {
        const attrConfig = programWrapper.config.attributes[name];

        let dataCount: number | undefined = ((): number | undefined => {
            const dataAny = data as any;
            if (dataAny.hasOwnProperty('length')) {
                return dataAny.length / attrConfig.size;
            }
            const byteLen = dataAny.byteLength;
            const bytesPerElement = dataAny.constructor.BYTES_PER_ELEMENT;
            if (byteLen !== undefined && bytesPerElement) {
                return byteLen / (bytesPerElement * attrConfig.size);
            }
            return undefined;
        })();
        if (count == undefined) {
            count = dataCount;
        } else {
            if (count !== dataCount) {
                throw new Error(
                    `Attr '${name}' had wrong count: ` +
                    `expected ${count}, found ${dataCount}`);
            }
        }

        const buffer = gl.createBuffer()!;
        gl.bindBuffer(attrConfig.target, buffer);
        gl.bufferData(attrConfig.target, data, attrConfig.usage);

        const location = gl.getAttribLocation(program, name);
        gl.enableVertexAttribArray(location);
        gl.vertexAttribPointer(
            location,
            attrConfig.size,
            attrConfig.type,
            attrConfig.normalize,
            attrConfig.stride,
            attrConfig.offset);
    }

    if (count === undefined) {
        throw new Error(
            `Unable to determine 'count' automatically. Try passing it ` +
            `manually, or using an array with a '.length' property`);
    }

    for (const [name, data] of Object.entries(config.uniforms)) {
        const uniformType = programWrapper.config.uniforms[name];
        const uniformLocation = gl.getUniformLocation(program, name);
        const uniformFn = gl[uniformType];
        uniformFn.call(gl, uniformLocation, ...data);
    }

    gl.drawArrays(programWrapper.config.drawMode, config.offset ?? 0, count);
}

