import { BKP_DRAG, BKP_DRAG_END, BKP_DRAG_START, BkpDragEvent, DragDetail } from "../bkp_drag_drop/events.js";
import { ScreenCoord } from "../data_structures/coord.js";
import { Piece } from "../data_structures/piece.js";
import { Controller } from "./controller.js";
import { Z_INDICES } from "./z_indices.js";
import { computeOutlinePath } from "../svg/path_util.js";
import { createLetterEl } from "./letter.js";

interface CssTransformCoords {
    translateX: number;
    translateY: number;
}


export class PieceController extends Controller {
    private dragStartCoords: CssTransformCoords | undefined = undefined;

    constructor(readonly piece: Piece) {
        super();
    }

    protected override createEl(): SVGGraphicsElement {
        const el =
            document.createElementNS('http://www.w3.org/2000/svg', 'g');
        el.classList.add('piece');
        return el;
    }

    protected override decorate(el: SVGGraphicsElement): void {
        const path =
            document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('d', computeOutlinePath(this.piece.getLetterGrid()));
        path.setAttribute('stroke', 'black');
        path.setAttribute('fill', 'blue');
        path.setAttribute('fill-opacity', '0.7');

        path.setAttribute('bkp-draggable', 'true');
        path.addEventListener(
            BKP_DRAG_START,
            (e: BkpDragEvent) => this.dragstart(e.detail.curPos));
        path.addEventListener(
            BKP_DRAG,
            (e: BkpDragEvent) => this.drag(e.detail));
        path.addEventListener(
            BKP_DRAG_END,
            (e: BkpDragEvent) => this.dragend(e.detail));
        el.appendChild(path);

        const letterGrid = this.piece.getLetterGrid();
        for (let row = 0; row < this.piece.height; row++) {
            for (let col = 0; col < this.piece.width; col++) {
                const letter = letterGrid[row][col];
                if (letter === null) {
                    continue;
                }
                el.appendChild(createLetterEl(row, col, letter));
            }
        }
    }

    private dragstart(clientPos: ScreenCoord): void {
        if (this.dragStartCoords !== undefined) {
            return;
        }
        const el = this.getElStrict();
        this.dragStartCoords = getTranslateXY(el);

        el.style.zIndex = Z_INDICES.PIECE_DRAG;
        el.classList.add('dragging');
    }

    private drag(detail: DragDetail): void {
        if (!this.dragStartCoords) {
            return;
        }
        const deltaX = detail.curPos.x - detail.startPos.x;
        const deltaY = detail.curPos.y - detail.startPos.y;

        const el = this.getElStrict();
        const translateX = this.dragStartCoords.translateX + deltaX;
        const translateY = this.dragStartCoords.translateY + deltaY;
        el.setAttribute('transform', `translate(${translateX} ${translateY})`);
    }

    private dragend(detail: DragDetail): void {
        if (!this.dragStartCoords) {
            return;
        }
        // Reuse drag() to make sure top & left are set to their final
        // coordinates. (Not sure if this is actually necessary, but it can't
        // hurt)
        this.drag(detail);
        this.dragStartCoords = undefined;

        const el = this.getElStrict();
        el.style.zIndex = 'auto';
        el.classList.remove('dragging');

        // Make el the last child inside of parentEl, so that it stays on top
        // when it's dropped.
        const parentEl = el.parentElement;
        el.remove();
        parentEl?.appendChild(el);
    }
}

function getTranslateXY(element: SVGGraphicsElement): CssTransformCoords {
    // https://stackoverflow.com/questions/46434687/get-the-current-matrix-transformation-of-an-svg-element#answer-46448918
    const matrix = element.transform.baseVal.consolidate()?.matrix;

    if (!matrix) {
        // Not sure why matrix could be null, my best guess is that it means
        // there are no transforms applied and so this would be the correct
        // return val.
        return { translateX: 0, translateY: 0 };
    }

    // https://stackoverflow.com/questions/8851023/how-to-get-the-actual-x-y-position-of-an-element-in-svg-with-transformations-and#answer-9190682
    return {
        translateX: matrix.e,
        translateY: matrix.f
    };
}
