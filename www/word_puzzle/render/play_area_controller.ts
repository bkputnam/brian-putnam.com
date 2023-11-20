import { WORD_SIZE } from "../data/solutions.js";
import { Board } from "../data_structures/board.js";
import { Solution } from "../data_structures/solution.js";
import { BoardController } from "./board_controller.js";
import { Controller } from "./controller.js";
import { PieceController } from "./piece_controller.js";
import { PlayAreaModel } from "./play_area_model.js";

export class PlayAreaController extends Controller {
    readonly model: PlayAreaModel;
    readonly boardController: BoardController;

    constructor(private readonly solution: Solution) {
        super();
        this.model = new PlayAreaModel(this, solution);
        this.boardController = new BoardController(this.model);
    }

    protected override createEl(): HTMLElement {
        const el = document.createElement('div');
        el.classList.add('play-area');
        return el;
    }

    protected override decorate(el: HTMLElement): void {
        el.appendChild(this.boardController.render());
        const unplacedPieces = this.model.unplacedPieces;
        for (const [pieceController, screenCoord] of unplacedPieces.entries()) {
            const pieceEl = pieceController.render();
            pieceEl.style.top = `${screenCoord.y}px`;
            pieceEl.style.left = `${screenCoord.x}px`;
            el.appendChild(pieceEl);
        }
    }
}
