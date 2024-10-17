export type UniformType = 'uniform1f' | 'uniform2f' | 'uniform3f' | 'uniform4f' |
    'uniform1i' | 'uniform2i' | 'uniform3i' | 'uniform4i';

export type UniformConfig = {
    [name: string]: UniformType,
};

export type UniformData<T extends UniformType> =
    T extends 'uniform1f' ? GLfloat :
    T extends 'uniform2f' ? [GLfloat, GLfloat] :
    T extends 'uniform3f' ? [GLfloat, GLfloat, GLfloat] :
    T extends 'uniform4f' ? [GLfloat, GLfloat, GLfloat, GLfloat] :
    T extends 'uniform1i' ? GLint :
    T extends 'uniform2i' ? [GLint, GLint] :
    T extends 'uniform3i' ? [GLint, GLint, GLint] :
    T extends 'uniform4i' ? [GLint, GLint, GLint, GLint] :
    never;

export type UniformDataObj<T extends UniformConfig> = {
    [Property in keyof T]: UniformData<T[Property]>;
};

export function populateUniforms<T extends UniformConfig>(
    gl: WebGL2RenderingContext,
    program: WebGLProgram,
    config: T,
    dataObj: UniformDataObj<T>
) {
    for (const [name, data] of Object.entries(dataObj)) {
        const uniformType = config[name];
        const uniformLocation = gl.getUniformLocation(program, name);
        const dataArr = Array.isArray(data) ? data : [data];
        const uniformFn = gl[uniformType];
        uniformFn.call(gl, uniformLocation, ...dataArr);
    }
}