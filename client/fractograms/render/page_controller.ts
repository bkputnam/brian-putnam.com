import { SOLUTIONS } from "../data/solutions.js";
import { Board } from "../data_structures/board.js";
import { Solution } from "../data_structures/solution.js";
import { daysSinceDailyStart } from "../util/date_math.js";
import { MAX_SLICE_INDEX, fetchSliceHash } from "../util/fetch_slices.js";
import { toFragment, fromFragment } from "../util/fragment_hash.js";
import { hashNum, randInt } from "../util/random.js";
import { Timer } from "../util/time.js";
import { IntroDialog } from "./intro_dialog.js";
import { PlayAreaController } from "./play_area_controller.js";

export type GameType = 'daily' | 'random' | 'link';

class GameState {
    isComplete = false;
    timer = Timer.newStarted();
    numHints = 0;
    numHintCells = 0;

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

interface SolutionIndices {
    solutionIndex: number,
    sliceIndex: number,
    gameType: GameType,
    hash: string,
}

export class PageController {
    private element: SVGGraphicsElement | null = null;
    private gameState: GameState | null = null;

    constructor(
        private readonly parent: HTMLElement,
        private readonly onWinCallback: () => void) { }

    private async tryGetHashIndices(): Promise<SolutionIndices | null> {
        if (location.hash) {
            let hash = location.hash;
            // I think hash will always start with '#' if it exists?
            if (hash.startsWith('#')) {
                hash = hash.substring(1);
            }
            const dateMatch = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(hash);
            if (dateMatch) {
                const date = new Date(
                    Number(dateMatch[1]),
                    Number(dateMatch[2]) - 1,
                    Number(dateMatch[3]),
                );
                return this.getDailySolutionIndices(date);
            }
            try {
                return {
                    ...fromFragment(hash),
                    gameType: 'link',
                    hash: hash,
                };
            } catch (e) {
                // Invalid hash - ignore and fall back to default random
                // behavior. Probably means someone typed their own hash into
                // the url.
            }
        }
        return null;
    }

    private getRandomSolutionIndices(): SolutionIndices {
        const randomIndices = {
            solutionIndex: randInt(0, SOLUTIONS.length),
            sliceIndex: randInt(0, MAX_SLICE_INDEX),
        };
        return {
            ...randomIndices,
            gameType: 'random',
            hash: toFragment(randomIndices),
        };
    }

    private async getDailySolutionIndices(date: Date): Promise<SolutionIndices> {
        if (date.getTime() > Date.now()) {
            alert(`Shame! 🔔 Shame! 🔔 Shame! 🔔`);
            return this.getRandomSolutionIndices();
        }
        const daysSinceStart = daysSinceDailyStart(date);
        const monthStr = String(date.getMonth() + 1).padStart(2, '0');
        const dayStr = String(date.getDate()).padStart(2, '0');
        const hash = `${date.getFullYear()}-${monthStr}-${dayStr}`;
        return {
            solutionIndex:
                await hashNum(daysSinceStart, SOLUTIONS.length),
            sliceIndex:
                await hashNum(daysSinceStart, MAX_SLICE_INDEX),
            gameType: 'daily',
            hash,
        };
    }

    private async getSolutionIndices(gameType: GameType): Promise<SolutionIndices> {
        // 'random' game type is always a subsequent game, not an initial game,
        // and so it should ignore location.hash
        if (gameType == 'random') {
            return await this.getRandomSolutionIndices();
        }
        // If we get here, gameType is expected to be 'daily'. However, since
        // 'daily' is always used for initial games, we may want to override the
        // daily puzzle with one read from the url hash, so attempt that first.
        // Note that if the hash is a `yyyy-mm-dd` style url then
        // hashIndices.hashType will still be 'daily'.
        const hashIndices = await this.tryGetHashIndices();
        if (hashIndices) {
            return hashIndices;
        }
        if (gameType == 'daily') {
            return this.getDailySolutionIndices(new Date());
        }
        // It's probably impossible to hit this code
        return this.getRandomSolutionIndices();
    }

    private async getSolution(gameType: GameType): Promise<Solution> {
        const indices = await this.getSolutionIndices(gameType);
        location.hash = indices.hash;
        const solutionText = SOLUTIONS[indices.solutionIndex];
        console.log(solutionText);
        const pieces = await fetchSliceHash(indices.sliceIndex);
        return new Solution(solutionText, pieces, indices.gameType);
    }

    private async render(gameType: GameType): Promise<SVGGraphicsElement> {
        const solution = await this.getSolution(gameType);
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

    async clearAndRender(gameType: GameType): Promise<void> {
        if (this.element) {
            this.element.remove();
        }
        this.parent.appendChild(await this.render(gameType));
        this.gameState!.playAreaController.renderPieces();
    }

    isComplete() {
        return this.gameState?.isComplete ?? false;
    }

    applyHint() {
        if (this.gameState) {
            const numHintCells = this.gameState.playAreaController.applyHint();
            if (numHintCells > 0) {
                this.gameState.numHints++;
                this.gameState.numHintCells += numHintCells;
            }
        }
    }

    getTimer(): Timer {
        return this.gameState?.timer ?? Timer.newPaused();
    }

    getGameType(): GameType {
        return this.gameState!.solution.gameType;
    }

    getHintStats(): { numHints: number, numCells: number } {
        const gameState = this.gameState!;
        return {
            numHints: gameState.numHints,
            numCells: gameState.numHintCells,
        };
    }
}