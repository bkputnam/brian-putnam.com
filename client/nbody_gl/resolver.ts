export class Resolver<T> {
    readonly promise: Promise<T>;
    public readonly resolve: (result: T) => void;
    public readonly reject: (reason: Error) => void;

    constructor() {
        let _resolve: typeof this.resolve;
        let _reject: typeof this.reject;
        this.promise = new Promise((resolve, reject) => {
            _resolve = resolve;
            _reject = reject;
        });
        this.resolve = _resolve!;
        this.reject = _reject!;
    }
}