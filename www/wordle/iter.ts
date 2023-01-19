
export function* zip<T, U>(iter1: Iterable<T>, iter2: Iterable<U>): Iterable<[T, U]> {
    const it1 = iter1[Symbol.iterator]();
    const it2 = iter2[Symbol.iterator]();
    while (true) {
        const {value: value1, done: done1} = it1.next();
        const {value: value2, done: done2} = it2.next();
        if (done1 || done2) {
            return;
        }
        yield [value1, value2];
    }
}

export function range(stop: number): Iterable<number>;
export function range(start: number, stop: number): Iterable<number>;
export function* range(a: number, b?: number): Iterable<number> {
    const [start, stop] = arguments.length === 1 ?
        [0, a] : [a, b!];
    for (let i = start; i < stop; i++) {
        yield i;
    }
}
