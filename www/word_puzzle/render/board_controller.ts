import { BKP_DROP_TARGET_ATTR } from "../bkp_drag_drop/drag_drop_service.js";
import { BKP_DROP, BkpDragEvent, DragDetail } from "../bkp_drag_drop/events.js";
import { CELL_WIDTH_PX } from "../consts.js";
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
        const isInBounds =
            row >= 0 &&
            row < WORD_SIZE &&
            col >= 0 &&
            col < WORD_SIZE;
        if (!isInBounds) {
            return;
        }
        const snapToXY = boardToSvgCoords({ row, col });
        pieceController.setTranslateXY(snapToXY);
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
    return {
        row: Math.round((coord.translateY - 1) / CELL_WIDTH_PX),
        col: Math.round(coord.translateX / CELL_WIDTH_PX + 2.5),
    };
}

function boardToSvgCoords(coord: BoardCoord): CssTransformCoords {
    return {
        translateX: (coord.col - 2.5) * CELL_WIDTH_PX,
        translateY: coord.row * CELL_WIDTH_PX + 1,
    };
}
