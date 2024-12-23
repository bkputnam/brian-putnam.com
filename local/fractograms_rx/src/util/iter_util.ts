export function* iterNested<T extends number[]>(...dims: T): Iterable<T> {
  if (dims.length == 0) {
    return;
  } else if (dims.length === 1) {
    for (let i = 0; i < dims[0]; i++) {
      yield [i] as T;
    }
  } else {
    const subDims = dims.slice(1);
    for (let i = 0; i < dims[0]; i++) {
      for (const subResult of iterNested(...subDims)) {
        yield [i, ...subResult] as T;
      }
    }
  }
}
