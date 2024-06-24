interface Dimensions {
    minWidth: number,
    minHeight: number,
    maxWidth: number,
    maxHeight: number,
}

export abstract class Carousel {
    private pageIndex = 0;
    private viewportContents: HTMLElement | null = null;

    constructor(
        private readonly dimensions: Dimensions,
        private readonly numPages: number
    ) { }

    abstract renderPage(pageIndex: number): HTMLElement;

    render(): HTMLElement {
        const viewport = document.createElement('div');
        viewport.classList.add('carousel');

        this.viewportContents = document.createElement('div');
        this.viewportContents.classList.add('carousel-contents');
        this.viewportContents.style.minWidth = this.dimensions.minWidth + 'px';
        this.viewportContents.style.minHeight = this.dimensions.minHeight + 'px';
        this.viewportContents.style.width = (100 * this.numPages) + '%';
        this.viewportContents.style.maxHeight = this.dimensions.maxHeight + 'px';
        viewport.appendChild(this.viewportContents);

        for (let i = 0; i < this.numPages; i++) {
            this.viewportContents.appendChild(this.renderPageContainer(i));
        }

        viewport.appendChild(this.renderControls());

        return viewport;
    }

    private renderControls(): HTMLElement {
        const footer = document.createElement('div');
        footer.classList.add('carousel-footer');

        const prevBtn = document.createElement('button');
        prevBtn.classList.add('prev-btn');
        prevBtn.innerText = 'Previous';
        prevBtn.addEventListener('click', () => {
            this.scrollPrev();
        })
        footer.appendChild(prevBtn);

        const nextBtn = document.createElement('button');
        nextBtn.classList.add('next-btn');
        nextBtn.innerText = 'Next';
        nextBtn.addEventListener('click', () => {
            this.scrollNext();
        });
        footer.appendChild(nextBtn);

        return footer;
    }

    private renderPageContainer(pageIndex: number): HTMLElement {
        const container = document.createElement('div');
        container.classList.add('carousel-page-container');
        container.appendChild(this.renderPage(pageIndex));
        return container;
    }

    private scrollTo(newPageIndex: number) {
        if (newPageIndex < 0 || newPageIndex >= this.numPages) {
            return;
        }
        const translateX = newPageIndex * 100 / this.numPages;
        this.viewportContents!.style.transform = `translateX(-${translateX}%)`;
        this.pageIndex = newPageIndex;
    }

    private scrollNext() {
        this.scrollTo(this.pageIndex + 1);
    }

    private scrollPrev() {
        this.scrollTo(this.pageIndex - 1);
    }
}