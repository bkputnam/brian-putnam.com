export class Resolver<T> {
    readonly resolve: (result: T) => void;
    readonly reject: (error: Error) => void;
    readonly promise: Promise<T>;

    constructor() {
        let resolve_: (result: T) => void = () => { };
        let reject_: (error: Error) => void = () => { };
        this.promise = new Promise<T>((resolve, reject) => {
            resolve_ = resolve;
            reject_ = reject;
        });
        this.resolve = resolve_;
        this.reject = reject_;
    }
}