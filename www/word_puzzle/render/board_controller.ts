import { BKP_DROP_TARGET_ATTR } from "../bkp_drag_drop/drag_drop_service.js";
import { BKP_DROP, BkpDragEvent, DragDetail } from "../bkp_drag_drop/events.js";
import { BORDER_WIDTH, CELL_WIDTH_PX } from "../consts.js";
import { WORD_SIZE } from "../data/solutions.js";
import { Board } from "../data_structures/board.js";
import { BoardCoord, CssTransformCoords, ScreenCoord } from '../data_structures/coord.js';
import { Controller } from "./controller.js";
import { createLetterEl } from "./letter.js";
import { PieceController } from "./piece_controller.js";
import { PlayAreaModel } from "./play_area_model.js";

export class BoardController extends Controller {
    private readonly board: Board;
    private readonly cells: Array<Array<SVGGraphicsElement>> = [];

    constructor(private readonly model: PlayAreaModel) {
        super();
        this.board = model.board;
    }

    protected override createEl(): SVGGraphicsElement {
        const board =
            document.createElementNS('http://www.w3.org/2000/svg', 'g');
        board.id = 'board';
        board.setAttribute(BKP_DROP_TARGET_ATTR, 'true');
        return board;
    }

    protected override decorate(el: SVGGraphicsElement): void {
        el.addEventListener(
            BKP_DROP,
            (e: BkpDragEvent) => this.onDrop(e.detail));

        // Shift most y-coordinates down to account for thicker borders
        const shiftY =
            BORDER_WIDTH / 2;
        const maxOffset =
            WORD_SIZE * (CELL_WIDTH_PX + BORDER_WIDTH) + shiftY;

        for (let row = 0; row < WORD_SIZE; row++) {
            const rowCells: SVGGraphicsElement[] = [];
            this.cells.push(rowCells);
            for (let col = 0; col < WORD_SIZE; col++) {
                const xOffset = col * (CELL_WIDTH_PX + BORDER_WIDTH);
                const yOffset = row * (CELL_WIDTH_PX + BORDER_WIDTH);

                const cell = document
                    .createElementNS('http://www.w3.org/2000/svg', 'rect');
                cell.setAttribute('x', xOffset + '');
                cell.setAttribute('y', yOffset + shiftY + '');
                cell.setAttribute('width', CELL_WIDTH_PX + BORDER_WIDTH + '');
                cell.setAttribute('height', CELL_WIDTH_PX + BORDER_WIDTH + '');
                cell.setAttribute('stroke', 'black');
                cell.setAttribute('stroke-width', BORDER_WIDTH + '');
                cell.classList.add('cell');
                rowCells.push(cell);
                el.appendChild(cell);

                const letter = this.board.getLetterAtCoord({ row, col });
                if (letter === null) {
                    continue;
                }
                el.appendChild(createLetterEl(row, col, letter));
                cell.classList.add('hint');
            }
        }
    }

    private onDrop(detail: DragDetail) {
        const pieceController = detail.dropController as PieceController;
        const transformCoords = pieceController.getTranslateXY();
        const { row, col } = svgToBoardCoords(transformCoords);
        if (this.board.tryPlacePiece(pieceController.piece, { row, col })) {
            const snapToXY = boardToSvgCoords({ row, col });
            pieceController.setTranslateXY(snapToXY);
            if (this.board.isComplete()) {
                this.model.notifyBoardComplete(this.board);
            }
        }
    }

    placePiece(pieceController: PieceController, coord: BoardCoord): boolean {
        return this.board.tryPlacePiece(pieceController.piece, coord);
    }

    pieceToHint(piece: PieceController, coord: BoardCoord): void {
        for (const pieceCoord of piece.piece.iterCoords()) {
            const row = pieceCoord.coord.row + coord.row;
            const col = pieceCoord.coord.col + coord.col;
            const letterEl = createLetterEl(row, col, pieceCoord.letter);
            this.getElStrict().appendChild(letterEl);

            const cell = this.cells[row][col];
            cell.classList.add('hint');
        }
        // If something has already been placed in the destination slots, move
        // it off the board to reduce confusion.
        const piecesToMove = this.board.pieceToHint(piece.piece, coord);
        for (const pieceToMove of piecesToMove) {
            this.model.placePieceRandomly(pieceToMove.getController()!);
        }
        if (this.board.isComplete()) {
            this.model.notifyBoardComplete(this.board);
        }
    }

    private screenToSVGCoords(coord: ScreenCoord): ScreenCoord {
        const svgEl =
            this.getElStrict().closest('svg') as unknown as SVGSVGElement;
        const screenPoint = svgEl.createSVGPoint();
        screenPoint.x = coord.x;
        screenPoint.y = coord.y;
        const svgPoint =
            screenPoint.matrixTransform(svgEl.getScreenCTM()!.inverse());
        return {
            x: svgPoint.x,
            y: svgPoint.y,
        };
    }
}

function svgToBoardCoords(coord: CssTransformCoords): BoardCoord {
    const cb = CELL_WIDTH_PX + BORDER_WIDTH;
    return {
        row: Math.round(
            (coord.translateY - 0.5 * BORDER_WIDTH) / cb
        ),
        col: Math.round(
            (coord.translateX + 2.5 * cb) / cb
        ),
    };
}

function boardToSvgCoords(coord: BoardCoord): CssTransformCoords {
    const cb = CELL_WIDTH_PX + BORDER_WIDTH;
    return {
        translateX: (coord.col - 2.5) * cb,
        translateY: coord.row * cb + BORDER_WIDTH / 2,
    };
}
