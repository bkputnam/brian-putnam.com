import { Resolver } from "../util/resolver.js";

export abstract class Dialog {
    private readonly dialog: HTMLDialogElement;

    constructor() {
        this.dialog = document.createElement('dialog');
    }

    render(): HTMLElement {
        const header = document.createElement('form');

        header.method = 'dialog'
        header.classList.add('dialog-header');
        this.dialog.appendChild(header);

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
        this.dialog.appendChild(content);

        document.getElementById('dialogs')!.appendChild(this.dialog);
        return this.dialog;
    }

    protected abstract getTitle(): string;
    protected abstract renderHtmlContent(): HTMLElement;

    showModal(): Promise<void> {
        const resolver = new Resolver<void>();
        const closeCallback = () => {
            this.dialog.removeEventListener('close', closeCallback);
            resolver.resolve();
        };
        this.dialog.addEventListener('close', closeCallback);
        this.dialog.showModal();
        return resolver.promise;
    }

    close() {
        this.dialog.close();
    }
}