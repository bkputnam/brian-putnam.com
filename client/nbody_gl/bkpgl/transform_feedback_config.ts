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