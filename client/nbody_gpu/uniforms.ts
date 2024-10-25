import { TypedArray } from "./typed_arrays.js";
import { TypedArrayConstructor } from "./webgpu-utils/typed-arrays.js";
import { WGSLType } from "./webgpu-utils/wgsl-types.js";

function checkExhaustive(a: never) { }

type WGSLTypeFull = WGSLType |
    'vec2i' | 'vec3i' | 'vec4i' |
    'vec2u' | 'vec3u' | 'vec4u' |
    'vec2f' | 'vec3f' | 'vec4f' |
    'mat2x2f' | 'mat2x3f' | 'mat2x4f' |
    'mat3x2f' | 'mat3x3f' | 'mat3x4f' |
    'mat4x2f' | 'mat4x3f' | 'mat4x4f';

function toWgslType(typeOrAlias: WGSLTypeFull): WGSLType | undefined {
    const result = toWgslTypeHelper(typeOrAlias);
    if (!WGSL_TYPE_SIZES.has(result)) {
        return undefined;
    }
    return result;
}

function toWgslTypeHelper(typeOrAlias: WGSLTypeFull): WGSLType {
    const prefix = typeOrAlias.substring(0, typeOrAlias.length - 1);
    const suffix = typeOrAlias.charAt(typeOrAlias.length - 1);
    switch (suffix) {
        case 'f':
            return prefix + '<f32>' as WGSLType;
        case 'u':
            return prefix + '<u32>' as WGSLType;
        case 'i':
            return prefix + '<i32>' as WGSLType;
        default:
            return typeOrAlias as WGSLType;
    }
}

// Map<type, [size, align]>
const WGSL_TYPE_SIZES = new Map<WGSLType, [number, number]>([
    ['i32', [4, 4]],
    ['u32', [4, 4]],
    ['f32', [4, 4]],
    ['f16', [2, 2]],
    ['atomic<u32>', [4, 4]],
    ['atomic<i32>', [4, 4]],
    ['vec2<i32>', [8, 8]],
    ['vec2<u32>', [8, 8]],
    ['vec2<f32>', [8, 8]],
    ['vec2<f16>', [4, 4]],
    ['vec3<i32>', [12, 16]],
    ['vec3<u32>', [12, 16]],
    ['vec3<f32>', [12, 16]],
    ['vec3<f16>', [6, 8]],
    ['vec4<i32>', [16, 16]],
    ['vec4<u32>', [16, 16]],
    ['vec4<f32>', [16, 16]],
    ['vec4<f16>', [8, 8]],
    ['mat2x2<f32>', [16, 8]],
    ['mat2x2<f16>', [8, 4]],
    ['mat3x2<f32>', [24, 8]],
    ['mat3x2<f16>', [12, 4]],
    ['mat4x2<f32>', [32, 8]],
    ['mat4x2<f16>', [16, 4]],
    ['mat2x3<f32>', [32, 16]],
    ['mat2x3<f16>', [16, 8]],
    ['mat3x3<f32>', [48, 16]],
    ['mat3x3<f16>', [24, 8]],
    ['mat4x3<f32>', [64, 16]],
    ['mat4x3<f16>', [32, 8]],
    ['mat2x4<f32>', [32, 16]],
    ['mat2x4<f16>', [16, 8]],
    ['mat3x4<f32>', [48, 16]],
    ['mat3x4<f16>', [24, 8]],
    ['mat4x4<f32>', [64, 16]],
    ['mat4x4<f16>', [32, 8]],
]);

function getTypedArrayCtor(type: WGSLType): TypedArrayConstructor {
    const match = /^(vec\d|mat\dx\d)<([^>]+)>$/.exec(type);
    if (match) {
        const subType = match[2] as WGSLType;
        try {
            return getTypedArrayCtor(subType);
        } catch (e: unknown) {
            const subMsg = (e as Error).message;
            throw new Error(
                `Error with type ${type} (as ${subType}): ${subMsg}`);
        }
    }

    switch (type) {
        case 'i32':
            return Int32Array;
        case 'u32':
            return Uint32Array;
        case 'f32':
            return Float32Array;
        case 'f16':
            throw new Error('Float16Array not supported');
        default:
            throw new Error(`Unknown type: ${type}`);
    }
}

class BufferAligner {
    readonly arrayBuffer: ArrayBuffer;
    readonly indexByteSize: number;

    private readonly types: Map<string, WGSLType>;
    private readonly offsets: Map<string, number>;

    constructor(
        private readonly defintion: Array<[string, WGSLTypeFull]>,
        private readonly numItems: number,
    ) {
        const mappedTypes: Array<[string, WGSLType]> = defintion.map(
            ([key, typeOrAlias]) => {
                const type = toWgslType(typeOrAlias);
                if (!type) {
                    throw new Error(`Invalid type: "${type}"`);
                }
                return [key, type];
            });
        this.types = new Map<string, WGSLType>(mappedTypes);

        // NOTE: The math here is probably too simplistic. This article goes
        // into some more of the details:
        // https://webgpufundamentals.org/webgpu/lessons/webgpu-memory-layout.html
        let offset = 0;
        this.offsets = new Map<string, number>();
        for (const [name, type] of mappedTypes) {
            this.offsets.set(name, offset);

            const [_, align] = WGSL_TYPE_SIZES.get(type)!;
            offset += align;
        }
        // At this point offset will include the size of the last item, and so
        // it's basically the length of one single item in the buffer.
        this.indexByteSize = offset;
        this.arrayBuffer = new ArrayBuffer(this.indexByteSize * numItems);
    }

    setAtIndex(name: string, index: number, ...values: number[]) {
        const offset = this.offsets.get(name);
        const type = this.types.get(name);
        if (offset === undefined || type === undefined) {
            throw new Error(`Unrecognized name: "${name}"`);
        }
        const byteOffset = index * this.indexByteSize + offset;
        const typedArrayCtor = getTypedArrayCtor(type);
        const typedArray = new typedArrayCtor(this.arrayBuffer, byteOffset);
        typedArray.set(values);
    }
}

class UniformAligner {
    readonly arrayBuffer: ArrayBuffer;
    readonly byteSize: number;

    private readonly bufferAligner: BufferAligner;

    constructor(defintion: Array<[string, WGSLTypeFull]>) {
        this.bufferAligner = new BufferAligner(defintion, 1);
        this.arrayBuffer = this.bufferAligner.arrayBuffer;
        this.byteSize = this.bufferAligner.indexByteSize;
    }

    set(name: string, ...values: number[]) {
        this.bufferAligner.setAtIndex(name, 0, ...values);
    }
}

export const RENDER_UNIFORM_ALIGNER = new UniformAligner([
    ['viewportMinXy', 'vec2f'],
    ['viewportMaxXy', 'vec2f'],
]);

export const COMPUTE_UNIFORM_ALIGNER = new UniformAligner([
    ['numBodies', 'u32'],
    ['deltaT', 'f32'],
]);
