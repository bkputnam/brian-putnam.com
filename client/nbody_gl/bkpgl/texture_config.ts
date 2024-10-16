// This is just shorthand to make life easier
type gl = WebGLRenderingContextBase;
type gl2 = WebGL2RenderingContextBase;

type TextureTarget =
    gl['TEXTURE_2D'] |
    gl['TEXTURE_CUBE_MAP_POSITIVE_X'] |
    gl['TEXTURE_CUBE_MAP_NEGATIVE_X'] |
    gl['TEXTURE_CUBE_MAP_POSITIVE_Y'] |
    gl['TEXTURE_CUBE_MAP_NEGATIVE_Y'] |
    gl['TEXTURE_CUBE_MAP_POSITIVE_Z'] |
    gl['TEXTURE_CUBE_MAP_NEGATIVE_Z'];

type TextureInternalFormat =
    gl['RGBA'] | gl['RGB'] | gl['RGBA'] | gl['RGBA'] | gl['RGB'] |
    gl['LUMINANCE_ALPHA'] | gl['LUMINANCE'] | gl['ALPHA'] | gl2['R8'] |
    gl2['R8_SNORM'] | gl2['RG8'] | gl2['RG8_SNORM'] | gl2['RGB8'] |
    gl2['RGB8_SNORM'] | gl['RGB565'] | gl['RGBA4'] | gl['RGB5_A1'] |
    gl['RGBA8'] | gl2['RGBA8_SNORM'] | gl2['RGB10_A2'] | gl2['RGB10_A2UI'] |
    gl2['SRGB8'] | gl2['SRGB8_ALPHA8'] | gl2['R16F'] | gl2['RG16F'] |
    gl2['RGB16F'] | gl2['RGBA16F'] | gl2['R32F'] | gl2['RG32F'] |
    gl2['RGB32F'] | gl2['RGBA32F'] | gl2['R11F_G11F_B10F'] | gl2['RGB9_E5'] |
    gl2['R8I'] | gl2['R8UI'] | gl2['R16I'] | gl2['R16UI'] | gl2['R32I'] |
    gl2['R32UI'] | gl2['RG8I'] | gl2['RG8UI'] | gl2['RG16I'] | gl2['RG16UI'] |
    gl2['RG32I'] | gl2['RG32UI'] | gl2['RGB8I'] | gl2['RGB8UI'] |
    gl2['RGB16I'] | gl2['RGB16UI'] | gl2['RGB32I'] | gl2['RGB32UI'] |
    gl2['RGBA8I'] | gl2['RGBA8UI'] | gl2['RGBA16I'] | gl2['RGBA16UI'] |
    gl2['RGBA32I'] | gl2['RGBA32UI'];

type TextureType =
    gl['UNSIGNED_BYTE'] |
    gl['UNSIGNED_SHORT_5_6_5'] |
    gl['UNSIGNED_SHORT_4_4_4_4'] |
    gl['UNSIGNED_SHORT_5_5_5_1'] |
    gl['BYTE'] |
    gl['UNSIGNED_SHORT'] |
    gl['SHORT'] |
    gl['UNSIGNED_INT'] |
    gl['INT'] |
    gl2['HALF_FLOAT'] |
    gl['FLOAT'] |
    gl2['UNSIGNED_INT_2_10_10_10_REV'] |
    gl2['UNSIGNED_INT_10F_11F_11F_REV'] |
    gl2['UNSIGNED_INT_5_9_9_9_REV'] |
    gl2['UNSIGNED_INT_24_8'];

// type PixelSource = ImageData | HTMLImageElement | HTMLCanvasElement |
//     HTMLVideoElement | ImageBitmap | Uint8Array | Uint16Array | Uint32Array |
//     Float32Array;


export function formatLookup(
    gl: WebGL2RenderingContext,
    internalFormat: TextureInternalFormat): GLenum {
    switch (internalFormat) {
        case gl.RGB: return gl.RGB;
        case gl.RGBA: return gl.RGBA;
        case gl.LUMINANCE_ALPHA: return gl.LUMINANCE_ALPHA;
        case gl.LUMINANCE: return gl.LUMINANCE;
        case gl.ALPHA: return gl.ALPHA;
        case gl.R8: return gl.RED;
        case gl.R16F: return gl.RED;
        case gl.R32F: return gl.RED;
        case gl.R8UI: return gl.RED_INTEGER;
        case gl.RG8: return gl.RG;
        case gl.RG16F: return gl.RG;
        case gl.RG32F: return gl.RG;
        case gl.RG8UI: return gl.RG_INTEGER;
        case gl.RGB8: return gl.RGB;
        case gl.SRGB8: return gl.RGB;
        case gl.RGB565: return gl.RGB;
        case gl.R11F_G11F_B10F: return gl.RGB;
        case gl.RGB9_E5: return gl.RGB;
        case gl.RGB16F: return gl.RGB;
        case gl.RGB32F: return gl.RGB;
        case gl.RGB8UI: return gl.RGB_INTEGER;
        case gl.RGBA8: return gl.RGBA;
        case gl.SRGB8_ALPHA8: return gl.RGBA;
        case gl.RGB5_A1: return gl.RGBA;
        case gl.RGB10_A2: return gl.RGBA;
        case gl.RGBA4: return gl.RGBA;
        case gl.RGBA16F: return gl.RGBA;
        case gl.RGBA32F: return gl.RGBA;
        case gl.RGBA8UI: return gl.RGBA_INTEGER;
        default:
            throw new Error(
                `Unrecognized texture internalFormat: ${internalFormat}`);
    }
}

interface TexImage2D_Base {
    /** The name of the `uniform sampler2d` in the shader source */
    name: string,

    /** A GLenum specifying the binding point (target) of the active texture. */
    target: TextureTarget,
    /** A GLint specifying the level of detail. Level 0 is the base image level
     * and level n is the n-th mipmap reduction level.  */
    level: GLint,
    /** A GLenum specifying the color components in the texture. */
    internalformat: TextureInternalFormat,
    /** A GLenum specifying the data type of the texel data. */
    type: TextureType,

    /** Configures calls to texParameteri and texParameterf */
    textureParams: Array<{
        type: 'texParameterf' | 'texParameteri'
        pname: GLenum,
        param: number,
    }>,

    unpackAlignment?: GLint,
}

interface TexImage2D_WithDims {
    /** A GLsizei specifying the width of the texture. */
    width: GLsizei,
    /** A GLsizei specifying the height of the texture. */
    height: GLsizei,
}

// texImage2D(target: GLenum, level: GLint, internalformat: GLint, width: GLsizei, height: GLsizei, border: GLint, format: GLenum, type: GLenum, pixels: ArrayBufferView | null): void;
export interface TexImage2D_Signature1
    extends TexImage2D_Base, TexImage2D_WithDims {
    // Note: MDN and TypeScript disagree on the types this param can have. I
    // went with the TypeScript version so my code would compile.
    pixels: ArrayBufferView | null,
}
function texImage2D_signature1(
    gl: WebGL2RenderingContext, params: TexImage2D_Signature1) {
    gl.texImage2D(
        params.target,
        params.level,
        params.internalformat,
        params.width,
        params.height,
            /* border= */ 0, // Must be 0
        formatLookup(gl, params.internalformat),
        params.type,
        params.pixels);
}

// texImage2D(target: GLenum, level: GLint, internalformat: GLint, format: GLenum, type: GLenum, source: TexImageSource): void;
export interface TexImage2D_Signature2 extends TexImage2D_Base {
    source: TexImageSource
}
function texImage2D_signature2(
    gl: WebGL2RenderingContext, params: TexImage2D_Signature2) {
    gl.texImage2D(
        params.target,
        params.level,
        params.internalformat,
        formatLookup(gl, params.internalformat),
        params.type,
        params.source);
}

// texImage2D(target: GLenum, level: GLint, internalformat: GLint, width: GLsizei, height: GLsizei, border: GLint, format: GLenum, type: GLenum, pboOffset: GLintptr): void;
export interface TexImage2D_Signature3
    extends TexImage2D_Base, TexImage2D_WithDims {
    /** A GLintptr byte offset into the WebGLBuffer's data store. Used to upload
     * data to the currently bound WebGLTexture from the WebGLBuffer bound to
     * the PIXEL_UNPACK_BUFFER target. */
    offset: GLintptr,
}
function texImage2D_signature3(
    gl: WebGL2RenderingContext, params: TexImage2D_Signature3) {
    gl.texImage2D(
        params.target,
        params.level,
        params.internalformat,
        params.width,
        params.height,
        /* border= */ 0, // Must be 0
        formatLookup(gl, params.internalformat),
        params.type,
        params.offset);
}

// texImage2D(target: GLenum, level: GLint, internalformat: GLint, width: GLsizei, height: GLsizei, border: GLint, format: GLenum, type: GLenum, source: TexImageSource): void;
export interface TexImage2D_Signature4
    extends TexImage2D_Base, TexImage2D_WithDims {
    source: TexImageSource,
}
function texImage2D_signature4(
    gl: WebGL2RenderingContext, params: TexImage2D_Signature4) {
    gl.texImage2D(
        params.target,
        params.level,
        params.internalformat,
        params.width,
        params.height,
        /* border= */ 0, // Must be 0
        formatLookup(gl, params.internalformat),
        params.type,
        params.source);
}

// texImage2D(target: GLenum, level: GLint, internalformat: GLint, width: GLsizei, height: GLsizei, border: GLint, format: GLenum, type: GLenum, srcData: ArrayBufferView, srcOffset: number): void;
export interface TexImage2D_Signature5
    extends TexImage2D_Base, TexImage2D_WithDims {
    srcData: ArrayBufferView,
    srcOffset: number
}
function texImage2D_signature5(
    gl: WebGL2RenderingContext, params: TexImage2D_Signature5) {
    gl.texImage2D(
        params.target,
        params.level,
        params.internalformat,
        params.width,
        params.height,
        /* border= */ 0, // Must be 0
        formatLookup(gl, params.internalformat),
        params.type,
        params.srcData,
        params.srcOffset);
}

export type TexImage2DConfig =
    TexImage2D_Signature1 |
    TexImage2D_Signature2 |
    TexImage2D_Signature3 |
    TexImage2D_Signature4 |
    TexImage2D_Signature5;

function texImage2D(gl: WebGL2RenderingContext, params: TexImage2DConfig) {
    // 1. texImage2D(target: GLenum, level: GLint, internalformat: GLint, width: GLsizei, height: GLsizei, border: GLint, format: GLenum, type: GLenum, pixels: ArrayBufferView | null): void;
    // 2. texImage2D(target: GLenum, level: GLint, internalformat: GLint, format: GLenum, type: GLenum, source: TexImageSource): void;
    // 3. texImage2D(target: GLenum, level: GLint, internalformat: GLint, width: GLsizei, height: GLsizei, border: GLint, format: GLenum, type: GLenum, pboOffset: GLintptr): void;
    // 4. texImage2D(target: GLenum, level: GLint, internalformat: GLint, width: GLsizei, height: GLsizei, border: GLint, format: GLenum, type: GLenum, source: TexImageSource): void;
    // 5. texImage2D(target: GLenum, level: GLint, internalformat: GLint, width: GLsizei, height: GLsizei, border: GLint, format: GLenum, type: GLenum, srcData: ArrayBufferView, srcOffset: number): void;
    const params1 = params as TexImage2D_Signature1;
    const params2 = params as TexImage2D_Signature2;
    const params3 = params as TexImage2D_Signature3;
    const params4 = params as TexImage2D_Signature4;
    const params5 = params as TexImage2D_Signature5;

    if (params1.pixels) {
        texImage2D_signature1(gl, params1);
    }
    else if (!params.hasOwnProperty('width') && !params.hasOwnProperty('height')) {
        texImage2D_signature2(gl, params2);
    }
    else if (params3.offset) {
        texImage2D_signature3(gl, params3);
    }
    else if (params4.source) {
        texImage2D_signature4(gl, params4);
    }
    else if (params5.srcData && params5.srcOffset) {
        texImage2D_signature5(gl, params5);
    }
    else {
        throw new Error('This should be impossible');
    }
}

/**
 * Configures a Texture2D in WebGL2.
 * 
 * Excluded properties:
 * - texImage2D param `border` - since it must always be 0, the library will
 *      just hardcode that for you.
 * - textImage2D param `format` - `format` is dictated by `internalFormat` [1],
 *      and so specifying only `internalFormat` is sufficient; we use a lookup
 *      table to get the appropriate `format` value.
 */
export interface Texture2DConfig {
    texImage2DConfig2: TexImage2DConfig[],
}

export function configureTextures(
    gl: WebGL2RenderingContext,
    config: Texture2DConfig,
) {
    for (const [index, texConfig] of config.texImage2DConfig2.entries()) {
        const tex = gl.createTexture();
        gl.activeTexture(gl.TEXTURE0 + index);
        gl.bindTexture(gl.TEXTURE_2D, tex);

        const unpackAlignment = texConfig.unpackAlignment ?? 4;
        gl.pixelStorei(gl.UNPACK_ALIGNMENT, unpackAlignment);
        texImage2D(gl, texConfig);
        for (const texParam of texConfig.textureParams) {
            if (texParam.type === 'texParameterf') {
                gl.texParameterf(
                    texConfig.target, texParam.pname, texParam.param);
            } else {
                gl.texParameteri(
                    texConfig.target, texParam.pname, texParam.param);
            }
        }
    }
}

export function setTextureUniforms(
    gl: WebGL2RenderingContext,
    program: WebGLProgram,
    config: Texture2DConfig,
) {
    for (const [index, texConfig] of config.texImage2DConfig2.entries()) {
        const loc = gl.getUniformLocation(program, texConfig.name);
        // tell the shader the src texture is on texture unit `index`
        gl.uniform1i(loc, index);
    }
}