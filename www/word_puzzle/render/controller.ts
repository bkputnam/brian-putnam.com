export abstract class Controller {
    private readonly el: SVGGraphicsElement;

    constructor() {
        this.el = this.createEl();
    }

    render(): SVGGraphicsElement {
        this.el.innerHTML = '';
        this.decorate(this.el);
        return this.el;
    }

    getElStrict(): SVGGraphicsElement {
        if (!this.el) {
            throw new Error(`this.el hasn't been created yet`);
        }
        return this.el;
    }

    protected abstract createEl(): SVGGraphicsElement;
    protected abstract decorate(el: SVGGraphicsElement): void;
}
