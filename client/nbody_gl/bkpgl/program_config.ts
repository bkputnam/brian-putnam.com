import { AttributeConfig, AttributeDataObj } from "./attribute_config.js";
import { TransformFeedbackConfig, TransformFeedbackOutput, TransformFeedbackRunConfig } from "./transform_feedback_config.js";
import { UniformType } from "./uniform_config.js";

type gl = WebGLRenderingContextBase;
// type gl2 = WebGL2RenderingContextBase;

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
    rasterizerDiscard?: boolean,

    attributes: { [name: string]: AttributeConfig },
    uniforms?: { [name: string]: UniformType },
    transformFeedback?: TransformFeedbackConfig,
};

// Helps to make mapped types on optional properties by mapping the 'undefined'
// part of the type to 'never'.
type IfPresent<T extends unknown | undefined, OUT> =
    T extends undefined ? never : OUT;

export interface WebGL2ProgramWrapper<T extends WebGL2ProgramConfig> {
    config: T,
    program: WebGLProgram,
    transformFeedback: IfPresent<T['transformFeedback'],
        TransformFeedbackRunConfig>,
}

export interface WebGL2RunConfig<T extends WebGL2ProgramConfig> {
    offset?: GLint,
    count?: GLsizei,

    attributes: AttributeDataObj<T['attributes']>,
    uniforms:
    T['uniforms'] extends undefined ? never : { [name: string]: UniformType },
}

export interface WebGL2RunOutput<T extends WebGL2ProgramConfig> {
    transformFeedback:
    T['transformFeedback'] extends TransformFeedbackConfig ?
    TransformFeedbackOutput<T['transformFeedback']> : never,
}