import { BKP_DRAGGABLE_ATTR } from "../bkp_drag_drop/drag_drop_service.js";
import { BKP_DRAG, BKP_DRAG_END, BKP_DRAG_START, BkpDragEvent, DragDetail } from "../bkp_drag_drop/events.js";
import { CssCoord, ScreenCoord } from "../data_structures/coord.js";
import { Piece } from "../data_structures/piece.js";
import { CELL_WIDTH_PX } from "./consts.js";
import { Controller } from "./controller.js";
import { Z_INDICES } from "./z_indices.js";

interface CssTransformCoords {
    translateX: number;
    translateY: number;
}

export class PieceController extends Controller {
    private dragStartCoords: CssTransformCoords | undefined = undefined;

    constructor(readonly piece: Piece) {
        super();
    }

    protected override createEl(): HTMLElement {
        const el = document.createElement('div');
        el.classList.add('piece');
        return el;
    }

    protected override decorate(el: HTMLElement): void {
        const letterGrid = this.piece.getLetterGrid();
        for (let rowIndex = 0; rowIndex < letterGrid.length; rowIndex++) {
            const row = letterGrid[rowIndex];
            for (let colIndex = 0; colIndex < row.length; colIndex++) {
                const letter = row[colIndex];
                if (letter == null) {
                    continue;
                }
                const cellEl = document.createElement('div');
                cellEl.classList.add('letter');
                cellEl.innerText = letter;
                const translateY =
                    `calc(var(--letter-side-len) * ${rowIndex} + ${rowIndex}px)`;
                const translateX =
                    `calc(var(--letter-side-len) * ${colIndex} + ${colIndex}px)`;
                cellEl.style.transform =
                    `translateX(${translateX}) translateY(${translateY})`;

                // Only populated cells should be draggable. Empty cells
                // should allow clicking through to whatever is underneath
                cellEl.setAttribute(BKP_DRAGGABLE_ATTR, 'true');
                cellEl.addEventListener(BKP_DRAG_START,
                    (e: DragEvent) => {
                        this.dragstart({ x: e.clientX, y: e.clientY });
                    });
                cellEl.addEventListener(BKP_DRAG, (e: BkpDragEvent) => {
                    this.drag(e.detail);
                });
                cellEl.addEventListener(BKP_DRAG_END, (e: BkpDragEvent) => {
                    this.dragend(e.detail);
                });
                el.appendChild(cellEl);
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
        el.style.transform =
            `translateX(${translateX}px) translateY(${translateY}px)`;
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

// https://stackoverflow.com/questions/42267189/how-to-get-value-translatex-by-javascript#answer-64654744
function getTranslateXY(element: HTMLElement): CssTransformCoords {
    const style = window.getComputedStyle(element);
    const matrix = new DOMMatrixReadOnly(style.transform);
    return {
        translateX: matrix.m41,
        translateY: matrix.m42
    };
}
