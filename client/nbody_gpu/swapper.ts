export class Swapper<T> {
    private isA = true;

    constructor(
        private readonly groupA: T,
        private readonly groupB: T
    ) { }

    swap() {
        this.isA = !this.isA;
    }

    get(): T {
        return this.isA ? this.groupA : this.groupB;
    }
}