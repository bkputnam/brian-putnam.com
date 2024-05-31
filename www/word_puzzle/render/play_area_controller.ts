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
        el.addEventListener('dragover', (e: DragEvent) => this.onDragover(e));
        el.addEventListener('drop', (e: DragEvent) => this.onDrop(e));

        el.appendChild(this.boardController.render());
        const unplacedPieces = this.model.unplacedPieces;
        for (const [pieceController, screenCoord] of unplacedPieces.entries()) {
            const pieceEl = pieceController.render();
            pieceEl.style.transform =
                `translateX(${screenCoord.x}px) translateY(${screenCoord.y}px)`;
            el.appendChild(pieceEl);
        }
    }

    onDragover(e: DragEvent): void {
        e.preventDefault();
        console.log('dragover');
    }

    onDrop(e: DragEvent): void {
        console.log('drop');
        const startCoords = JSON.parse(
            e.dataTransfer!.getData('text/dragstartcoords'));
        const endCoords = { x: e.clientX, y: e.clientY };
        const delta = {
            x: endCoords.x - startCoords.x,
            y: endCoords.y - startCoords.y,
        };
        const pieceEl = document.querySelector('.dragging') as HTMLElement;
        pieceEl.style.top = parseInt(pieceEl.style.top) + delta.y + 'px';
        pieceEl.style.left = parseInt(pieceEl.style.left) + delta.x + 'px';
    }
}
