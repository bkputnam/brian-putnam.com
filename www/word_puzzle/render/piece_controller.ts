import { Piece } from "../data_structures/piece.js";
import { Controller } from "./controller.js";

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
}
