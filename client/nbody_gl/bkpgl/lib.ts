import { populateAttributes } from "./attribute.js";
import * as canvasResize from "./canvas_resize.js";
import { ShaderType, WebGL2ProgramConfig, WebGL2ProgramWrapper, WebGL2RunConfig, WebGL2RunOutput } from "./program_config.js";
import { bindTFBuffers, initTransformFeedback, prepareToReadTFBuffers, readTFBuffers, SeparateVaryingConfig, TransformFeedbackInterleavedOutput, TransformFeedbackRunConfig, TransformFeedbackSeparateOutput } from "./transform_feedback.js";
import { populateUniforms } from "./uniform_config.js";

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
    const tfConfig = config.transformFeedback;
    if (tfConfig) {
        initTransformFeedback(gl, program, tfConfig);
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

    if (tfConfig) {
        result.transformFeedback = bindTFBuffers(gl, program, tfConfig);
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

    const count = populateAttributes(
        gl,
        programWrapper.program,
        programWrapper.config.attributes,
        config.attributes,
        config.count,
    );

    // The presence of either 'uniforms' property implies the presense of the
    // other, but checking for both makes the compiler happy.
    if (config.uniforms && programWrapper.config.uniforms) {
        populateUniforms(
            gl, program, programWrapper.config.uniforms, config.uniforms);
    }

    const result: any = {};

    const tfConfig = programWrapper.config.transformFeedback;
    const tfRunConfig = programWrapper.transformFeedback;
    if (tfConfig && tfRunConfig) {
        prepareToReadTFBuffers(gl, tfRunConfig, programWrapper.config.drawMode);
    }
    gl.drawArrays(programWrapper.config.drawMode, config.offset ?? 0, count);
    if (tfConfig && tfRunConfig) {
        result.transformFeedback = readTFBuffers(
            gl,
            tfConfig,
            tfRunConfig,
            programWrapper.config.drawMode);
    }

    if (programWrapper.config.rasterizerDiscard) {
        gl.disable(gl.RASTERIZER_DISCARD);
    }

    return result as WebGL2RunOutput<T>;
}
