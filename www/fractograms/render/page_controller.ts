import { SOLUTIONS } from "../data/solutions.js";
import { Board } from "../data_structures/board.js";
import { Solution } from "../data_structures/solution.js";
import { MAX_SLICE_INDEX, fetchSliceHash } from "../util/fetch_slices.js";
import { toFragment, fromFragment } from "../util/fragment_hash.js";
import { randInt } from "../util/random.js";
import { Timer } from "../util/time.js";
import { IntroDialog } from "./intro_dialog.js";
import { PlayAreaController } from "./play_area_controller.js";

class GameState {
    isComplete = false;
    timer = Timer.newStarted();

    constructor(
        readonly pageController: PageController,
        readonly solution: Solution,
        readonly playAreaController: PlayAreaController,
        readonly onCompleteCallback: (self: GameState) => void) {
        playAreaController.onBoardComplete().then((board: Board) => {
            this.timer.stop();
            if (!this.isComplete) {
                this.isComplete = true;
                onCompleteCallback(this);
            }
        });
    }
}

export class PageController {
    private element: SVGGraphicsElement | null = null;
    private gameState: GameState | null = null;

    constructor(
        private readonly parent: HTMLElement,
        private readonly onWinCallback: () => void) { }

    private getSolutionAndSliceIndices(): { solutionIndex: number, sliceIndex: number } {
        if (location.hash) {
            let hash = location.hash;
            // I think hash will always start with '#' if it exists?
            if (hash.startsWith('#')) {
                hash = hash.substring(1);
            }
            try {
                return fromFragment(hash);
            } catch (e) {
                // Invalid hash - ignore and fall back to default random
                // behavior. Probably means someone typed their own hash into
                // the url.
            }
        }
        const randomIndices = {
            solutionIndex: randInt(0, SOLUTIONS.length),
            sliceIndex: randInt(0, MAX_SLICE_INDEX),
        };
        location.hash = toFragment(randomIndices);
        return randomIndices;
    }

    private async getSolution(): Promise<Solution> {
        const { sliceIndex, solutionIndex } = this.getSolutionAndSliceIndices();
        const solutionText = SOLUTIONS[solutionIndex];
        console.log(solutionText);
        const pieces = await fetchSliceHash(sliceIndex);
        return new Solution(solutionText, pieces);
    }

    private async render(): Promise<SVGGraphicsElement> {
        this.showIntroDialog();
        const solution = await this.getSolution();
        const playAreaController = new PlayAreaController(solution);
        this.gameState = new GameState(
            this,
            solution,
            playAreaController,
            (notifyingGameState: GameState) => {
                // If an obsolete GameState somehow manages to call its
                // callback, ignore it
                if (notifyingGameState === this.gameState) {
                    this.onWinCallback();
                }
            }
        );
        this.element = playAreaController.render();
        return this.element;
    }

    private showIntroDialog(): void {
        const dialog = new IntroDialog();
        dialog.render();
        dialog.showModal();
    }

    async clearAndRender(): Promise<void> {
        if (this.element) {
            this.element.remove();
        }
        this.parent.appendChild(await this.render());
        this.gameState!.playAreaController.renderPieces();
    }

    isComplete() {
        return this.gameState?.isComplete ?? false;
    }

    applyHint() {
        if (this.gameState) {
            this.gameState.playAreaController.applyHint();
        }
    }

    getTimer(): Timer {
        return this.gameState?.timer ?? Timer.newPaused();
    }
}