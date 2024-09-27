import { SOLUTIONS } from "../data/solutions.js";
import { Board } from "../data_structures/board.js";
import { PieceAtCoord } from "../data_structures/piece.js";
import { Solution } from "../data_structures/solution.js";
import { getSolutionStats, HintStats, serializeHintStats, setSolutionStats, SolutionStats } from "../data_structures/solution_stats.js";
import { daysSinceDailyStart } from "../util/date_math.js";
import { MAX_SLICE_INDEX, fetchSliceHash } from "../util/fetch_slices.js";
import { toFragment, fromFragment } from "../util/fragment_hash.js";
import { hashNum, randInt } from "../util/random.js";
import { Timer } from "../util/time.js";
import { IntroDialog } from "./intro_dialog.js";
import { PlayAreaController } from "./play_area_controller.js";
import { WinMessage } from "./win_message.js";

export type GameType = 'daily' | 'random' | 'link';

class GameState {
    isComplete = false;
    timer = Timer.newStarted();

    private readonly hints: PieceAtCoord[] = [];

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

    recordHint(hint: PieceAtCoord) {
        this.hints.push(hint);
    }

    getHints(): PieceAtCoord[] {
        return this.hints;
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
        const solutionStats = getSolutionStats(indices.hash);
        return new Solution(
            solutionText,
            pieces,
            indices.gameType,
            indices.hash,
            solutionStats);
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

    displayWinMessage(): void {
        const gameState = this.gameState;
        if (!gameState) {
            throw new Error('Cannot display win message: missing game state');
        }
        if (!gameState.isComplete) {
            throw new Error('Cannot display win message: game not finished');
        }
        let solutionStats: SolutionStats;
        if (gameState.solution.solutionStats) {
            // The player has won this game previously, and we're displaying a
            // win message because we've just finished automatically
            // reconstructing the player's win from a previous page load. Don't
            // Overwrite the hintStats in localStorage in that case.
            solutionStats = gameState.solution.solutionStats;
        } else {
            // This is the normal case: the player played the game normally and
            // won, so we should record winStats to localStorage.
            solutionStats = {
                hash: gameState.solution.hash,
                gameType: gameState.solution.gameType,
                solutionText: this.gameState!.solution.getSolutionText(
                    /* colSeparator= */ '', /* rowSeparator= */ ''),
                elapsedMs: this.getTimer().getElapsedMs(),
                hints: serializeHintStats({ hints: gameState.getHints() }),
            };
            setSolutionStats(solutionStats);
        }
        const winMessage = new WinMessage(solutionStats);
        const winMessageEl = winMessage.render();
        this.parent.appendChild(winMessageEl);
        this.parent.classList.add('solved');
    }

    private showIntroDialog(): void {
        const dialog = new IntroDialog();
        dialog.render();
        dialog.showModal();
    }

    async clearAndRender(gameType: GameType): Promise<void> {
        this.parent.innerHTML = '';
        this.parent.classList.remove('solved');
        this.element = null;
        this.parent.appendChild(await this.render(gameType));
        this.gameState!.playAreaController.renderPieces();
    }

    isComplete() {
        return this.gameState?.isComplete ?? false;
    }

    applyHint() {
        if (this.gameState) {
            const pieceAtCoord = this.gameState.playAreaController.applyHint();
            if (pieceAtCoord) {
                this.gameState.recordHint(pieceAtCoord);
            }
        }
    }

    getTimer(): Timer {
        return this.gameState?.timer ?? Timer.newPaused();
    }

    getGameType(): GameType {
        return this.gameState!.solution.gameType;
    }

    getHintStats(): HintStats {
        const gameState = this.gameState!;
        return {
            hints: gameState.getHints(),
        };
    }
}