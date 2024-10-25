// Float16Array isn't widely supported at the time of this writing:
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Float16Array
export type TypedArray =
    Int8Array | Uint8Array | Uint8ClampedArray | Int16Array | Uint16Array |
    Int32Array | Uint32Array /* | Float16Array */ | Float32Array |
    Float64Array /* | BigInt64Array | BigUint64Array */;

export type TypedArrayCtor =
    (new () => TypedArray) &
    (new (len: number) => TypedArray) &
    (new (typedArray: TypedArray) => TypedArray) &
    (new (object: Object) => TypedArray) &
    (new (buffer: ArrayBuffer) => TypedArray) &
    (new (buffer: ArrayBuffer, byteOffset: number) => TypedArray) &
    (new (buffer: ArrayBuffer, byteOffset: number, length: number)
        => TypedArray) &
    {
        BYTES_PER_ELEMENT: number
    };

// Much like the builtin ReturnType<...> type, but works with `new` functions
export type CtorType<T extends TypedArray> =
    T extends new (...args: any) => infer S ? S : never;