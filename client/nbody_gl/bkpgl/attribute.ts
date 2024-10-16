import { TypedArray } from "./typed_arrays.js";

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

export type SrcData =
    ArrayBuffer | SharedArrayBuffer | TypedArray | DataView;

export interface AttributeConfig {
    size: 1 | 2 | 3 | 4,
    type: AttributeType,
    /** Ignored for integer types */
    normalize: GLboolean,
    stride: GLsizei,
    offset: GLintptr,

    target: AttributeTarget,
    usage: AttributeUsage,
}

export type AttributeConfigObj = {
    [name: string]: AttributeConfig
}

export type AttributeDataObj<T extends AttributeConfigObj> = {
    [Property in keyof T]: SrcData;
};

function isInt(gl: WebGL2RenderingContext, type: AttributeType): boolean {
    switch (type) {
        case gl.FLOAT:
        case gl.HALF_FLOAT:
            return false;
        case gl.BYTE:
        case gl.SHORT:
        case gl.UNSIGNED_BYTE:
        case gl.UNSIGNED_SHORT:
        case gl.INT:
        case gl.UNSIGNED_INT:
        case gl.INT_2_10_10_10_REV:
        case gl.UNSIGNED_INT_2_10_10_10_REV:
            return true;
    }
}

export function populateAttributes<T extends AttributeConfigObj>(
    gl: WebGL2RenderingContext,
    program: WebGLProgram,
    aConfig: T,
    aData: AttributeDataObj<T>,
    count: number | undefined,
): number {
    const entries = Object.entries(aData);
    for (const [name, data] of entries) {
        const attrConfig = aConfig[name];

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
        if (location === -1) {
            throw new Error(
                `getAttribLocation('${name}') failed. Attribute name ` +
                `'${name}' may be  misspelled, or the GLSL compiler may have ` +
                `removed it if isn't being used by the shader code.`);
        }
        gl.enableVertexAttribArray(location);
        // https://stackoverflow.com/questions/78203199/webgl-2-0-unsigned-integer-input-variable
        if (isInt(gl, attrConfig.type)) {
            // Note that attrConfig.normalize is ignored
            gl.vertexAttribIPointer(
                location,
                attrConfig.size,
                attrConfig.type,
                attrConfig.stride,
                attrConfig.offset);
        } else {
            gl.vertexAttribPointer(
                location,
                attrConfig.size,
                attrConfig.type,
                attrConfig.normalize,
                attrConfig.stride,
                attrConfig.offset);

        }
    }
    if (entries.length === 0) {
        return 0;
    }
    if (count === undefined) {
        throw new Error(
            `Unable to determine 'count' automatically. Try passing it ` +
            `manually, or using an array with a '.length' property`);
    }
    return count;
}