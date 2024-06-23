import { SOLUTIONS } from "../data/solutions.js";
import { Board } from "../data_structures/board.js";
import { Solution } from "../data_structures/solution.js";
import { pick1 } from "../util/random.js";
import { Timer } from "../util/time.js";
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

    private getSolution(): Solution {
        const solutionText = pick1(SOLUTIONS);
        console.log(solutionText);
        return new Solution(solutionText);
    }

    private render(): SVGGraphicsElement {
        const solution = this.getSolution();
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

    clearAndRender() {
        if (this.element) {
            this.element.remove();
        }
        this.parent.appendChild(this.render());
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