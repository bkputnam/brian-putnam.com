import { Piece } from "../data_structures/piece.js";
import { BoardController } from "./board_controller.js";
import { Controller } from "./controller.js";

export class PieceController extends Controller {
    constructor(readonly piece: Piece) {
        super();
    }

    protected override createEl(): HTMLElement {
        const el = document.createElement('pre');
        el.classList.add('piece');
        return el;
    }

    protected override decorate(el: HTMLElement): void {
        el.innerText = this.piece.toString();
    }
}
