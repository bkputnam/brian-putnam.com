import { CELL_WIDTH_PX } from "../consts.js";
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

    protected override createEl(): SVGGraphicsElement {
        const board =
            document.createElementNS('http://www.w3.org/2000/svg', 'g');
        board.id = 'board';
        return board;
    }

    protected override decorate(el: SVGGraphicsElement): void {
        const maxOffset = WORD_SIZE * (CELL_WIDTH_PX + 1);
        for (let i = 0; i < (WORD_SIZE + 1); i++) {
            const offset = i * (CELL_WIDTH_PX + 1);

            const verticalLine =
                document.createElementNS('http://www.w3.org/2000/svg', 'line');
            verticalLine.setAttribute('x1', '' + offset);
            verticalLine.setAttribute('y1', '0');
            verticalLine.setAttribute('x2', '' + offset);
            verticalLine.setAttribute('y2', '' + maxOffset);
            verticalLine.setAttribute('stroke', 'black');

            const horizontalLine =
                document.createElementNS('http://www.w3.org/2000/svg', 'line');
            horizontalLine.setAttribute('x1', '0');
            horizontalLine.setAttribute('y1', '' + offset);
            horizontalLine.setAttribute('x2', '' + maxOffset);
            horizontalLine.setAttribute('y2', '' + offset);
            horizontalLine.setAttribute('stroke', 'black');

            el.appendChild(verticalLine);
            el.appendChild(horizontalLine);
        }
    }

    placePiece(pieceController: PieceController, coord: BoardCoord): boolean {
        return this.board.tryPlacePiece(pieceController.piece, coord);
    }
}


