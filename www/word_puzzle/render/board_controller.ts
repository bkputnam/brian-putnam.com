import { WORD_SIZE } from "../data/solutions.js";
import { Board } from "../data_structures/board.js";
import { BoardCoord } from '../data_structures/coord.js';
import { Controller } from "./controller.js";
import { PieceController } from "./piece_controller.js";
import { PlayAreaModel } from "./play_area_model.js";

export class BoardController extends Controller {
    private readonly board: Board;

    constructor(private readonly model: PlayAreaModel) {
        super();
        this.board = model.board;
    }

    protected override createEl(): HTMLElement {
        const el = document.createElement('div');
        el.classList.add('board');
        return el;
    }

    protected override decorate(el: HTMLElement): void {
        // TODO
    }

    placePiece(pieceController: PieceController, coord: BoardCoord): boolean {
        return this.board.tryPlacePiece(pieceController.piece, coord);
    }
}


