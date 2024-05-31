import { BKP_DRAGGABLE_ATTR } from "../bkp_drag_drop/drag_drop_service.js";
import { BKP_DRAG, BKP_DRAG_END, BKP_DRAG_START, BkpDragEvent, DragDetail } from "../bkp_drag_drop/events.js";
import { CssCoord, ScreenCoord } from "../data_structures/coord.js";
import { Piece } from "../data_structures/piece.js";
import { CELL_WIDTH_PX } from "./consts.js";
import { Controller } from "./controller.js";
import { Z_INDICES } from "./z_indices.js";

export class PieceController extends Controller {
    private dragStartCoords: CssCoord | undefined = undefined;

    constructor(readonly piece: Piece) {
        super();
    }

    protected override createEl(): HTMLElement {
        const el = document.createElement('table');
        el.classList.add('piece');
        return el;
    }

    protected override decorate(el: HTMLElement): void {
        // Units for width, height are cells (e.g. 1 cell by 4 cells), not px
        const { width, height } = this.piece;
        // Give the <table> the exact width that it needs. This prevents the
        // browser from squishing it when it's outside of its parent element.
        el.style.width = `calc(var(--letter-side-len) * ${width})`;
        el.style.height = `calc(var(--letter-side-len) * ${height})`;

        const letterGrid = this.piece.getLetterGrid();
        for (let rowIndex = 0; rowIndex < letterGrid.length; rowIndex++) {
            const row = letterGrid[rowIndex];
            const rowEl = document.createElement('tr');
            for (let colIndex = 0; colIndex < row.length; colIndex++) {
                const letter = row[colIndex];
                const cellEl = document.createElement('td');
                if (letter === null) {
                    cellEl.classList.add('empty');
                } else {
                    cellEl.classList.add('letter');
                    cellEl.innerText = letter;

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
                }
                rowEl.appendChild(cellEl);
            }
            el.appendChild(rowEl);
        }
    }

    private dragstart(clientPos: ScreenCoord): void {
        if (this.dragStartCoords !== undefined) {
            return;
        }
        const el = this.getElStrict();
        this.dragStartCoords = {
            top: parseInt(el.style.top),
            left: parseInt(el.style.left),
        };

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
        el.style.top = this.dragStartCoords!.top + deltaY + 'px';
        el.style.left = this.dragStartCoords!.left + deltaX + 'px';
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
