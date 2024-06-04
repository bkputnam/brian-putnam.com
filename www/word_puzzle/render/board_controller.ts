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
        for (let i = 0; i < (WORD_SIZE + 1); i++) {
            const offset = i * (CELL_WIDTH_PX + BORDER_WIDTH);

            const verticalLine =
                document.createElementNS('http://www.w3.org/2000/svg', 'line');
            verticalLine.setAttribute('x1', offset + '');
            verticalLine.setAttribute('y1', '0');
            verticalLine.setAttribute('x2', offset + '');
            verticalLine.setAttribute('y2', maxOffset + shiftY + '');
            verticalLine.setAttribute('stroke', 'black');
            verticalLine.setAttribute('stroke-width', BORDER_WIDTH + '');

            const horizontalLine =
                document.createElementNS('http://www.w3.org/2000/svg', 'line');
            horizontalLine.setAttribute('x1', - BORDER_WIDTH / 2 + '');
            horizontalLine.setAttribute('y1', offset + shiftY + '');
            horizontalLine.setAttribute('x2', maxOffset + '');
            horizontalLine.setAttribute('y2', offset + shiftY + '');
            horizontalLine.setAttribute('stroke', 'black');
            horizontalLine.setAttribute('stroke-width', BORDER_WIDTH + '');

            el.appendChild(verticalLine);
            el.appendChild(horizontalLine);
        }

        for (let row = 0; row < WORD_SIZE; row++) {
            for (let col = 0; col < WORD_SIZE; col++) {
                const letter = this.board.getLetterAtCoord({ row, col });
                if (letter === null) {
                    continue;
                }
                el.appendChild(createLetterEl(row, col, letter));
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
                setTimeout(() => {
                    alert('You win!');
                }, 10);
            }
        }
    }

    placePiece(pieceController: PieceController, coord: BoardCoord): boolean {
        return this.board.tryPlacePiece(pieceController.piece, coord);
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
