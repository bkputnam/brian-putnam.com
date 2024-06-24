import { Carousel } from "./carousel.js";

export class IntroCarousel extends Carousel {
    constructor() {
        super(
            {
                minWidth: 300,
                minHeight: 400,
                maxWidth: 600,
                maxHeight: 900,
            },
            /* numPages= */ 2
        );
    }

    renderPage(pageIndex: number): HTMLElement {
        switch (pageIndex) {
            case 0: return this.renderPage0();
            case 1: return this.renderPage1();
            default: throw new Error(`Unknown page index: ${pageIndex}`);
        }
    }

    private renderPage0(): HTMLElement {
        const content = document.createElement('div');
        content.appendChild(PAGE_0.paragraph1());
        content.appendChild(PAGE_0.dragDemo());
        return content;
    }

    private renderPage1(): HTMLElement {
        const content = document.createElement('div');
        content.appendChild(PAGE_1.paragraph1());
        content.appendChild(PAGE_1.hintDemo());
        return content;
    }
}

const PAGE_0 = {
    paragraph1(): HTMLElement {
        const p = document.createElement('p');
        p.innerHTML =
            'Drag puzzle pieces to create a word in every row and ' +
            'every column:';
        return p;
    },

    dragDemo(): HTMLElement {
        const vid = document.createElement('video');
        vid.src = "img/drag-demo.webm";
        vid.autoplay = true;
        vid.muted = true;
        vid.controls = true;
        return vid;
    },
};

const PAGE_1 = {
    paragraph1(): HTMLElement {
        const p = document.createElement('p');
        p.innerText =
            'Use hints if you get stuck. Smaller pieces will be placed first.';
        return p;
    },
    hintDemo(): HTMLElement {
        const vid = document.createElement('video');
        vid.src = "img/hint-demo.webm";
        vid.autoplay = true;
        vid.muted = true;
        vid.controls = true;
        return vid;
    }
};