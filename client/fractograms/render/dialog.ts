import { Resolver } from "../util/resolver.js";
import { Controller } from "./controller.js";

export abstract class Dialog extends Controller<HTMLDialogElement> {
    constructor() {
        super();
    }

    protected override createEl(): HTMLDialogElement {
        return document.createElement('dialog');
    }

    protected override decorate(dialog: HTMLDialogElement): void {
        const header = document.createElement('form');

        header.method = 'dialog'
        header.classList.add('dialog-header');
        dialog.appendChild(header);

        const title = document.createElement('h2');
        title.classList.add('title');
        title.innerText = this.getTitle();
        header.appendChild(title);

        const closeBtn = document.createElement('button');
        closeBtn.classList.add('close-btn');
        closeBtn.setAttribute('aria-label', 'Close');
        closeBtn.innerHTML = '<img src="img/close.svg" alt="Close" />';
        closeBtn.addEventListener('click', () => this.close());
        header.appendChild(closeBtn);

        const content = document.createElement('div');
        content.classList.add('dialog-content');
        content.appendChild(this.renderHtmlContent());
        dialog.appendChild(content);

        document.getElementById('dialogs')!.appendChild(dialog);
    }

    protected abstract getTitle(): string;
    protected abstract renderHtmlContent(): HTMLElement;

    showModal(): Promise<void> {
        const resolver = new Resolver<void>();
        const closeCallback = () => {
            this.getElStrict().removeEventListener('close', closeCallback);
            resolver.resolve();
        };
        this.getElStrict().addEventListener('close', closeCallback);
        this.getElStrict().showModal();
        return resolver.promise;
    }

    close() {
        this.getElStrict().close();
    }
}