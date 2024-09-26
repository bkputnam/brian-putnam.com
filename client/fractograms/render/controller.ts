export abstract class Controller<T extends SVGGraphicsElement | HTMLElement> {
    private readonly el: T;

    constructor() {
        this.el = this.createEl();
    }

    render(): T {
        this.el.innerHTML = '';
        this.decorate(this.el);
        return this.el;
    }

    getElStrict(): T {
        if (!this.el) {
            throw new Error(`this.el hasn't been created yet`);
        }
        return this.el;
    }

    protected abstract createEl(): T;
    protected abstract decorate(el: T): void;
}
