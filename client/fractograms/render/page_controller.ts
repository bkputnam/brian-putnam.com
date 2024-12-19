import { SOLUTIONS } from "../data/solutions.js";
import { Board } from "../data_structures/board.js";
import { PieceAtCoord } from "../data_structures/piece.js";
import { Solution } from "../data_structures/solution.js";
import {
  getSolutionStats,
  HintStats,
  serializeHintStats,
  setSolutionStats,
  SolutionStats,
} from "../data_structures/solution_stats.js";
import { fetchSliceHash } from "../util/fetch_slices.js";
import { getSolutionIndices, SolutionIndices } from "../util/solutions.js";
import { Timer } from "../util/time.js";
import { IntroDialog } from "./intro_dialog.js";
import { PlayAreaController } from "./play_area_controller.js";
import { WinMessage } from "./win_message.js";
import { GameType } from "../util/solutions.js";

class GameState {
  isComplete = false;
  timer = Timer.newStarted();

  private readonly hints: PieceAtCoord[] = [];

  constructor(
    readonly pageController: PageController,
    readonly solution: Solution,
    readonly playAreaController: PlayAreaController,
    readonly onCompleteCallback: (self: GameState) => void
  ) {
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

export class PageController {
  private element: SVGGraphicsElement | null = null;
  private gameState: GameState | null = null;

  constructor(
    private readonly parent: HTMLElement,
    private readonly onWinCallback: () => void
  ) {}

  private async getSolution(indices: SolutionIndices): Promise<Solution> {
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
      solutionStats
    );
  }

  private async render(
    solutionIndices: SolutionIndices
  ): Promise<SVGGraphicsElement> {
    const solution = await this.getSolution(solutionIndices);
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
      throw new Error("Cannot display win message: missing game state");
    }
    if (!gameState.isComplete) {
      throw new Error("Cannot display win message: game not finished");
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
          /* colSeparator= */ "",
          /* rowSeparator= */ ""
        ),
        elapsedMs: this.getTimer().getElapsedMs(),
        hints: serializeHintStats({ hints: gameState.getHints() }),
      };
      setSolutionStats(solutionStats);
    }
    const winMessage = new WinMessage(solutionStats);
    const winMessageEl = winMessage.render();
    this.parent.appendChild(winMessageEl);
    this.parent.classList.add("solved");
  }

  private showIntroDialog(): void {
    const dialog = new IntroDialog();
    dialog.render();
    dialog.showModal();
  }

  async clearAndRender(solutionIndices: SolutionIndices): Promise<void> {
    this.parent.innerHTML = "";
    this.parent.classList.remove("solved");
    this.element = null;
    this.parent.appendChild(await this.render(solutionIndices));
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
