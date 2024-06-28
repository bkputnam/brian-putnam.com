import { PageController } from "../render/page_controller.js";

interface GlobalGameState {
    pageController: PageController | null,
}

export const globalGameState: GlobalGameState = {
    pageController: null,
};

