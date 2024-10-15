import * as canvasResize from "./canvas_resize.js";
import { ShaderType, WebGL2ProgramConfig, WebGL2ProgramWrapper, WebGL2RunConfig, WebGL2RunOutput } from "./program_config.js";
import { SeparateVaryingConfig, TransformFeedbackInterleavedOutput, TransformFeedbackRunConfig, TransformFeedbackSeparateOutput } from "./transform_feedback_config.js";

export { resizeCanvasToDisplaySize } from "./canvas_resize.js";

export async function loadShaderSource(url: string): Promise<string> {
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Response status: ${response.status}`);
    }

    const result = await response.text();
    return result;
}

export function createShader(
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
    canvasResize.registerCanvas(gl.canvas);
    const [vertexSource, fragmentSource]: string[] = await Promise.all([
        loadShaderSource(config.vertexShaderSourceUrl),
        loadShaderSource(config.fragmentShaderSourceUrl),
    ]);

    const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexSource);
    const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentSource);

    const program = gl.createProgram()!;
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    if (config.transformFeedback) {
        const names = config.transformFeedback.varyingConfigs
            .map((vCfg) => vCfg.name);
        gl.transformFeedbackVaryings(
            program,
            names,
            config.transformFeedback.bufferMode,
        );
    }
    gl.linkProgram(program);
    const success = gl.getProgramParameter(program, gl.LINK_STATUS);
    if (!success) {
        const errMsg = gl.getProgramInfoLog(program);
        gl.deleteProgram(program);
        throw new Error(`Failed to create progrem: ${errMsg}`);
    }

    const vao = gl.createVertexArray();
    gl.bindVertexArray(vao);

    // The TypeScript compiler has a hard time with the IfPresent<...>
    // conditional type, so use 'any' for now as a hack. We'll cast to the
    // correct type when we return.
    let result: any = {
        config,
        program,
    };

    const tfConfig = config.transformFeedback;
    if (tfConfig) {
        const tf = gl.createTransformFeedback()!;
        gl.bindTransformFeedback(gl.TRANSFORM_FEEDBACK, tf);
        const numBuffers =
            tfConfig.bufferMode == gl.INTERLEAVED_ATTRIBS ? 1 :
                tfConfig.varyingConfigs.length;
        const transformFeedbackBuffers = new Array(numBuffers);
        for (let i = 0; i < numBuffers; i++) {
            const varyingConfig = tfConfig.varyingConfigs[i];
            const buffer = gl.createBuffer()!;
            transformFeedbackBuffers[i] = buffer;
            gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
            const numBytes: number = (() => {
                if (tfConfig.bufferMode == gl.INTERLEAVED_ATTRIBS) {
                    return tfConfig.totalByteLength;
                } else {
                    const vConf = varyingConfig as SeparateVaryingConfig;
                    const bytesPerElement = vConf.type.BYTES_PER_ELEMENT;
                    return vConf.length * bytesPerElement;
                }
            })();
            gl.bufferData(
                gl.ARRAY_BUFFER, numBytes, gl.STATIC_DRAW);
            gl.bindBufferBase(gl.TRANSFORM_FEEDBACK_BUFFER, i, buffer);
        }
        gl.bindTransformFeedback(gl.TRANSFORM_FEEDBACK, null);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
        let runConfig: TransformFeedbackRunConfig = {
            tf,
            buffers: transformFeedbackBuffers,
        };
        result.transformFeedback = runConfig;
    }

    return result as WebGL2ProgramWrapper<T>;
}

export function runProgramWithData<T extends WebGL2ProgramConfig>(
    programWrapper: WebGL2ProgramWrapper<T>,
    config: WebGL2RunConfig<T>): WebGL2RunOutput<T> {
    const program = programWrapper.program;
    const gl = programWrapper.config.gl;

    // Tell it to use our program (pair of shaders)
    gl.useProgram(program);

    if (programWrapper.config.rasterizerDiscard) {
        gl.enable(gl.RASTERIZER_DISCARD);
    }

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

    // The presence of either 'uniforms' property implies the presense of the
    // other, but checking for both makes the compiler happy.
    if (config.uniforms && programWrapper.config.uniforms) {
        for (const [name, data] of Object.entries(config.uniforms)) {
            const uniformType = programWrapper.config.uniforms[name];
            const uniformLocation = gl.getUniformLocation(program, name);
            const uniformFn = gl[uniformType];
            uniformFn.call(gl, uniformLocation, ...data);
        }
    }

    const result: any = {};

    const tfConfig = programWrapper.config.transformFeedback;
    const tfRunConfig = programWrapper.transformFeedback;
    if (tfConfig && tfRunConfig) {
        gl.bindTransformFeedback(gl.TRANSFORM_FEEDBACK, tfRunConfig.tf);
        gl.beginTransformFeedback(programWrapper.config.drawMode);
    }
    gl.drawArrays(programWrapper.config.drawMode, config.offset ?? 0, count);
    if (tfConfig && tfRunConfig) {
        gl.endTransformFeedback();
        gl.bindTransformFeedback(gl.TRANSFORM_FEEDBACK, null);

        if (tfConfig.bufferMode == gl.INTERLEAVED_ATTRIBS) {
            const arrayBuf = new ArrayBuffer(tfConfig.totalByteLength);
            const buffer = new DataView(arrayBuf);
            gl.bindBuffer(gl.ARRAY_BUFFER, tfRunConfig.buffers[0]);
            gl.getBufferSubData(
                gl.ARRAY_BUFFER,
                0,
                buffer);
            const tfResults: TransformFeedbackInterleavedOutput = {
                buffer,
            };
            result.transformFeedback = tfResults;
        } else {
            const tfResults: TransformFeedbackSeparateOutput<typeof tfConfig> =
            {
                buffers: tfConfig.varyingConfigs.map((vConfig, index) => {
                    const results = new vConfig.type(vConfig.length);
                    gl.bindBuffer(gl.ARRAY_BUFFER, tfRunConfig.buffers[index]);
                    gl.getBufferSubData(gl.ARRAY_BUFFER, 0, results);
                    return results;
                }),
            };
            result.transformFeedback = tfResults;
        }
    }

    if (programWrapper.config.rasterizerDiscard) {
        gl.disable(gl.RASTERIZER_DISCARD);
    }

    return result as WebGL2RunOutput<T>;
}
