import { Solution } from "../data_structures/solution.js";
import { BoardController } from "./board_controller.js";
import { Controller } from "./controller.js";
import { PlayAreaModel } from "./play_area_model.js";

export class PlayAreaController extends Controller {
    readonly model: PlayAreaModel;
    readonly boardController: BoardController;

    constructor(private readonly solution: Solution) {
        super();
        this.model = new PlayAreaModel(this, solution);
        this.boardController = new BoardController(this.model);
    }

    protected override createEl(): SVGGraphicsElement {
        const el =
            document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        el.id = 'play-area';
        return el;
    }

    protected override decorate(el: SVGGraphicsElement): void {
        // Use nested <svg> to shift everything right by 50% of page width
        // https://stackoverflow.com/questions/56364905/how-to-do-svg-transform-in-percentage#answer-56366560
        const centeringSvg =
            document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        centeringSvg.id = 'centering-svg';
        centeringSvg.setAttribute('x', '50%');

        centeringSvg.appendChild(this.boardController.render());
        const unplacedPieces = this.model.unplacedPieces;
        for (const [pieceController, screenCoord] of unplacedPieces.entries()) {
            const pieceEl = pieceController.render();
            pieceEl.setAttribute('transform',
                `translate(${screenCoord.x} ${screenCoord.y})`);
            centeringSvg.appendChild(pieceEl);
        }
        el.appendChild(centeringSvg);
    }

    onDrop(e: DragEvent): void {
        console.log('drop');
        const startCoords = JSON.parse(
            e.dataTransfer!.getData('text/dragstartcoords'));
        const endCoords = { x: e.clientX, y: e.clientY };
        const delta = {
            x: endCoords.x - startCoords.x,
            y: endCoords.y - startCoords.y,
        };
        const pieceEl = document.querySelector('.dragging') as HTMLElement;
        pieceEl.style.top = parseInt(pieceEl.style.top) + delta.y + 'px';
        pieceEl.style.left = parseInt(pieceEl.style.left) + delta.x + 'px';
    }
}
