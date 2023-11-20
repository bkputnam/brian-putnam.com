export abstract class Controller {
    private readonly el: HTMLElement;

    constructor() {
        this.el = this.createEl();
    }

    render(): HTMLElement {
        this.el.innerHTML = '';
        this.decorate(this.el);
        return this.el;
    }

    protected abstract createEl(): HTMLElement;
    protected abstract decorate(el: HTMLElement): void;
}
