import { Resolver } from "./resolver.js";
import * as twgl from "./twgl/twgl-full.module.js";

type GL = WebGLRenderingContext;
type GL2 = WebGL2RenderingContext;

type ShaderType = GL['VERTEX_SHADER'] | GL['FRAGMENT_SHADER'];

type TextureTarget =
    GL['TEXTURE_2D'] |
    GL['TEXTURE_CUBE_MAP_POSITIVE_X'] |
    GL['TEXTURE_CUBE_MAP_NEGATIVE_X'] |
    GL['TEXTURE_CUBE_MAP_POSITIVE_Y'] |
    GL['TEXTURE_CUBE_MAP_NEGATIVE_Y'] |
    GL['TEXTURE_CUBE_MAP_POSITIVE_Z'] |
    GL['TEXTURE_CUBE_MAP_NEGATIVE_Z'];

type TextureInternalFormat =
    GL['RGBA'] | GL['RGB'] | GL['RGBA'] | GL['RGBA'] | GL['RGB'] |
    GL['LUMINANCE_ALPHA'] | GL['LUMINANCE'] | GL['ALPHA'] | GL2['R8'] |
    GL2['R8_SNORM'] | GL2['RG8'] | GL2['RG8_SNORM'] | GL2['RGB8'] |
    GL2['RGB8_SNORM'] | GL['RGB565'] | GL['RGBA4'] | GL['RGB5_A1'] |
    GL['RGBA8'] | GL2['RGBA8_SNORM'] | GL2['RGB10_A2'] | GL2['RGB10_A2UI'] |
    GL2['SRGB8'] | GL2['SRGB8_ALPHA8'] | GL2['R16F'] | GL2['RG16F'] |
    GL2['RGB16F'] | GL2['RGBA16F'] | GL2['R32F'] | GL2['RG32F'] |
    GL2['RGB32F'] | GL2['RGBA32F'] | GL2['R11F_G11F_B10F'] | GL2['RGB9_E5'] |
    GL2['R8I'] | GL2['R8UI'] | GL2['R16I'] | GL2['R16UI'] | GL2['R32I'] |
    GL2['R32UI'] | GL2['RG8I'] | GL2['RG8UI'] | GL2['RG16I'] | GL2['RG16UI'] |
    GL2['RG32I'] | GL2['RG32UI'] | GL2['RGB8I'] | GL2['RGB8UI'] |
    GL2['RGB16I'] | GL2['RGB16UI'] | GL2['RGB32I'] | GL2['RGB32UI'] |
    GL2['RGBA8I'] | GL2['RGBA8UI'] | GL2['RGBA16I'] | GL2['RGBA16UI'] |
    GL2['RGBA32I'] | GL2['RGBA32UI'];

type TextureType =
    GL['UNSIGNED_BYTE'] |
    GL['UNSIGNED_SHORT_5_6_5'] |
    GL['UNSIGNED_SHORT_4_4_4_4'] |
    GL['UNSIGNED_SHORT_5_5_5_1'] |
    GL['BYTE'] |
    GL['UNSIGNED_SHORT'] |
    GL['SHORT'] |
    GL['UNSIGNED_INT'] |
    GL['INT'] |
    GL2['HALF_FLOAT'] |
    GL['FLOAT'] |
    GL2['UNSIGNED_INT_2_10_10_10_REV'] |
    GL2['UNSIGNED_INT_10F_11F_11F_REV'] |
    GL2['UNSIGNED_INT_5_9_9_9_REV'] |
    GL2['UNSIGNED_INT_24_8'];

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

export function sync(
    gl: WebGL2RenderingContext,
    timeoutMs = -1,
    pollIntervalMs = 0): Promise<{ numPolls: number, elapsedMs: number }> {
    // A GLbitfield specifying a bitwise combination of flags controlling the
    // behavior of the sync object. Must be 0 (exists for extensions only). 
    const fencSyncFlags = 0;
    const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, fencSyncFlags);
    if (!sync) {
        return Promise.reject(new Error('Failed to create sync object'));
    }
    const startMs = performance.now();
    return new Promise((resolve, reject) => {
        let numPolls = 0;
        const poll = () => {
            numPolls++;
            // A GLbitfield specifying a bitwise combination of flags
            // controlling the flushing behavior.
            // May be gl.SYNC_FLUSH_COMMANDS_BIT. 
            const clientWaitSyncFlags = 0;
            // A GLint64 specifying a timeout (in nanoseconds) for which to wait
            // for the sync object to become signaled. Must not be larger
            // than gl.MAX_CLIENT_WAIT_TIMEOUT_WEBGL.
            const clientWaitSyncTimeout = 0;
            const status = gl.clientWaitSync(
                sync, clientWaitSyncFlags, clientWaitSyncTimeout);
            switch (status) {
                case gl.ALREADY_SIGNALED:
                case gl.CONDITION_SATISFIED:
                    resolve({
                        numPolls,
                        elapsedMs: performance.now() - startMs
                    });
                    return;
                case gl.WAIT_FAILED:
                    reject(new Error('WAIT_FAILED'));
                    return;
                default:
                    // If we get here, status is gl.TIMEOUT_EXPIRED, but that
                    //just refers to `clientWaitSyncTimeout = 0` above. Since
                    // we want to wait asynchronously instead of synchronously,
                    // we use custom logic based on the timeoutMs parameter
                    // instead.
                    const elapsedMs = performance.now() - startMs;
                    if (timeoutMs > 0 && elapsedMs > timeoutMs) {
                        reject(new Error('TIMEOUT_EXPIRED'));
                        return;
                    }
                    // Note: don't use `Promise.resolve().then(poll)` here or
                    // below; it seems to get into an infinite waiting loop.
                    // Presumably because the current JS event loop tick needs
                    // to finish before the `sync` object receives its signal
                    // from WebGL?
                    setTimeout(poll, pollIntervalMs);
            }
        };
        // Note: don't use `Promise.resolve().then(poll)`, see above
        setTimeout(poll, pollIntervalMs);
    });
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
    internalFormat: TextureInternalFormat,
    data?: number[]):
    twgl.TextureOptions {
    const result: twgl.TextureOptions = {
        target: gl.TEXTURE_2D,
        level: 0,
        internalFormat,
        width: dims.width,
        height: dims.height,
        type: gl.FLOAT,
        min: gl.NEAREST,
        mag: gl.NEAREST,
        wrap: gl.CLAMP_TO_EDGE,
        src: data,
    };
    if (data !== undefined) {
        const texLen = dims.width * dims.height;
        if (internalFormat == gl.RGBA32F && data.length % 4 !== 0) {
            throw new Error(
                `Wrong data size: ${data.length}. Must be divisible by 4`);
        }
        if (data.length < texLen) {
            // Pad data with zeros to fill up entire texture, but don't modify
            // the input array
            const oldData = data;
            data = new Array(texLen);
            data.splice(0, oldData.length, ...oldData);
            data.fill(0, oldData.length);
        }
        result.src = data;
    }

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