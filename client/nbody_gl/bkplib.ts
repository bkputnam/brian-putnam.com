import { Resolver } from "./resolver.js";
import * as twgl from "./twgl/twgl-full.module.js";

type GL = WebGLRenderingContext;
type GL2 = WebGL2RenderingContext;
type ShaderType = GL['VERTEX_SHADER'] | GL['FRAGMENT_SHADER'];

async function loadShaderSource(url: string): Promise<string> {
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Response status: ${response.status}`);
    }

    const result = await response.text();
    return result;
}

export function loadShaderSources(vertUrl: string, fragUrl: string):
    Promise<[string, string]> {
    return Promise.all([
        loadShaderSource(vertUrl),
        loadShaderSource(fragUrl),
    ]);
}

export interface Dims {
    width: number,
    height: number,
}

export function dimsForLen(gl: GL2, len: number): Dims {
    const sideLen = Math.ceil(Math.sqrt(len));
    const max = gl.getParameter(gl.MAX_TEXTURE_SIZE);
    if (sideLen > max) {
        throw new Error(
            `Cannot create texture with ${len} elements: ` +
            `MAX_TEXTURE_SIZE is ${max} and ` +
            `so len cannot be greater than ${max} x ${max} = ${max * max}`);
    }
    return {
        width: sideLen,
        height: sideLen,
    };
}

export function makeFloatTexture(
    gl: GL2,
    dims: Dims,
    data?: number[]):
    twgl.TextureOptions {
    data = data ?? [];
    const texLen = dims.width * dims.height;
    if (data.length > texLen) {
        throw new Error(
            `data too long (${data.length} items) for ` +
            `${dims.width} x ${dims.height} texture`);
    }
    if (data.length < texLen) {
        // Pad data with zeros to fill up entire texture, but don't modify
        // the input array
        const oldData = data;
        data = new Array(texLen);
        data.splice(0, oldData.length, ...oldData);
        data.fill(0, oldData.length);
    }
    const result: twgl.TextureOptions = {
        target: gl.TEXTURE_2D,
        level: 0,
        internalFormat: gl.R32F,
        width: dims.width,
        height: dims.height,
        type: gl.FLOAT,
        min: gl.NEAREST,
        mag: gl.NEAREST,
        wrap: gl.CLAMP_TO_EDGE,
        src: data,
    };
    return result;
}

type TextureObject = { [key: string]: WebGLTexture };
interface CreateTexturesResult {
    textures: TextureObject,
    texturesReady: Promise<TextureObject>
}
export function createTextures(
    gl: GL2,
    options: { [key: string]: twgl.TextureOptions }):
    CreateTexturesResult {
    const resolver = new Resolver<TextureObject>();
    const textures = twgl.createTextures(
        gl,
        options, (err: any, textures: TextureObject) => {
            if (err) {
                const error = err instanceof Error ? err : new Error(err);
                resolver.reject(error);
                return;
            }
            resolver.resolve(textures);
        });
    return {
        textures,
        texturesReady: resolver.promise,
    };
}