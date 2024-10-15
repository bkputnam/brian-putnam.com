// Float16Array isn't widely supported at the time of this writing:
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Float16Array
export type TypedArray =
    Int8Array | Uint8Array | Uint8ClampedArray | Int16Array | Uint16Array |
    Int32Array | Uint32Array /* | Float16Array */ | Float32Array |
    Float64Array | BigInt64Array | BigUint64Array;

export type TypedArrayCtor = (new (len: number) => TypedArray) & {
    BYTES_PER_ELEMENT: number
};

// Much like the builtin ReturnType<...> type, but works with `new` functions
export type CtorType<T extends new (...args: any) => any> =
    T extends new (...args: any) => infer S ? S : never;