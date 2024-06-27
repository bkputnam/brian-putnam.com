import { Dialog } from "./dialog.js";
import { IntroCarousel } from "./intro_carousel.js";

export class IntroDialog extends Dialog {
    private carousel: IntroCarousel;

    constructor() {
        super();
        this.carousel = new IntroCarousel();
    }

    protected override getTitle(): string {
        return 'Fractograms';
    }

    protected override renderHtmlContent(): HTMLElement {
        return this.carousel.render();

    }
}
