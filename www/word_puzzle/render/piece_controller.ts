import { Piece } from "../data_structures/piece.js";
import { Controller } from "./controller.js";
import { Z_INDICES } from "./z_indexes.js";

export class PieceController extends Controller {
    constructor(readonly piece: Piece) {
        super();
    }

    protected override createEl(): HTMLElement {
        const el = document.createElement('table');
        el.classList.add('piece');
        return el;
    }

    protected override decorate(el: HTMLElement): void {
        el.draggable = true;
        el.addEventListener('dragstart', (e: DragEvent) => this.dragstart(e));
        el.addEventListener('dragend', (e: DragEvent) => this.dragend(e));

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
                }
                rowEl.appendChild(cellEl);
            }
            el.appendChild(rowEl);
        }
    }

    private dragstart(e: DragEvent): void {
        console.log('dragstart');
        const el = this.getElStrict();
        el.style.zIndex = Z_INDICES.PIECE_DRAG;
        el.classList.add('dragging');
        e.dataTransfer?.setData(
            'text/dragstartcoords',
            JSON.stringify({ x: e.clientX, y: e.clientY }));
    }

    private dragend(e: DragEvent): void {
        console.log('dragend');
        const el = this.getElStrict();
        el.style.zIndex = Z_INDICES.PIECE_DEFAULT;
        el.classList.remove('dragging');
    }
}
