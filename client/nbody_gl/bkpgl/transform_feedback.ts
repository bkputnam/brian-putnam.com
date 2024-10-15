import { DrawArraysMode } from "./program_config.js";
import { CtorType, TypedArray, TypedArrayCtor } from "./typed_arrays.js";

type gl2 = WebGL2RenderingContextBase;

type TransformFeedbackBufferMode =
    gl2['INTERLEAVED_ATTRIBS'] | gl2['SEPARATE_ATTRIBS'];

export interface TransformFeedbackInterleavedConfig {
    bufferMode: gl2['INTERLEAVED_ATTRIBS'],
    totalByteLength: number,
    varyingConfigs: Array<{
        name: string,
        length: number,
    }>,
}

export interface SeparateVaryingConfig {
    name: string,
    length: number,
    type: TypedArrayCtor,
}

export interface TransformFeedbackSeparateConfig {
    bufferMode: gl2['SEPARATE_ATTRIBS'],
    varyingConfigs: SeparateVaryingConfig[],
}

export type TransformFeedbackConfig =
    TransformFeedbackInterleavedConfig | TransformFeedbackSeparateConfig;

export interface TransformFeedbackRunConfig {
    tf: WebGLTransformFeedback,
    buffers: WebGLBuffer[],
}

export interface TransformFeedbackInterleavedOutput {
    buffer: DataView,
}

type SeparateBuffers<T extends SeparateVaryingConfig[]> = {
    [index in keyof T]: CtorType<T[index]['type']>
};

export interface TransformFeedbackSeparateOutput<
    T extends TransformFeedbackSeparateConfig> {
    buffers: SeparateBuffers<T['varyingConfigs']>
}

export type TransformFeedbackOutput<T extends TransformFeedbackConfig> =
    T extends TransformFeedbackSeparateConfig ?
    TransformFeedbackSeparateOutput<T> :
    TransformFeedbackInterleavedOutput;

export function initTransformFeedback(
    gl: WebGL2RenderingContext,
    program: WebGLProgram,
    tfConfig: TransformFeedbackConfig,
) {
    const names = tfConfig.varyingConfigs.map((vCfg) => vCfg.name);
    gl.transformFeedbackVaryings(
        program,
        names,
        tfConfig.bufferMode,
    );
}

export function bindTFBuffers(
    gl: WebGL2RenderingContext,
    program: WebGLProgram,
    tfConfig: TransformFeedbackConfig,
): TransformFeedbackRunConfig {
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
    return {
        tf,
        buffers: transformFeedbackBuffers,
    };
}

export function prepareToReadTFBuffers(
    gl: WebGL2RenderingContext,
    tfRunConfig: TransformFeedbackRunConfig,
    drawMode: DrawArraysMode,
) {
    gl.bindTransformFeedback(gl.TRANSFORM_FEEDBACK, tfRunConfig.tf);
    gl.beginTransformFeedback(drawMode);
}

export function readTFBuffers<T extends TransformFeedbackConfig>(
    gl: WebGL2RenderingContext,
    tfConfig: T,
    tfRunConfig: TransformFeedbackRunConfig,
    drawMode: DrawArraysMode,
): TransformFeedbackOutput<T> {
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
        return tfResults as TransformFeedbackOutput<T>;
    } else {
        const tfResults: TransformFeedbackSeparateOutput<any> =
        {
            buffers: tfConfig.varyingConfigs.map((vConfig, index) => {
                const results = new vConfig.type(vConfig.length);
                gl.bindBuffer(gl.ARRAY_BUFFER, tfRunConfig.buffers[index]);
                gl.getBufferSubData(gl.ARRAY_BUFFER, 0, results);
                return results;
            }),
        };
        return tfResults as TransformFeedbackOutput<T>;
    }
}