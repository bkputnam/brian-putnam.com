import { Solution } from "../data_structures/solution.js";
import { boxesIntersect } from "../util/geometry.js";
import { randBetween } from "../util/random.js";
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
        el.appendChild(centeringSvg);

        const boardEl = this.boardController.render();
        centeringSvg.appendChild(boardEl);
    }

    renderPieces(): void {
        const topSvgClientRect = this.getElStrict().getBoundingClientRect();
        const centeringSvg = document
            .getElementById('centering-svg') as unknown as SVGSVGElement;
        const boardClientRect = document
            .getElementById('board')!
            .getBoundingClientRect();

        const minX = Math.max(
            -(topSvgClientRect.width / 2),
            -200);
        const maxX = Math.min(
            topSvgClientRect.width / 2,
            200);
        const minY = 1;
        const maxY = Math.min(
            topSvgClientRect.height - 1,
            400);

        for (const pieceController of this.model.pieces) {
            const pieceEl = pieceController.render();
            centeringSvg.appendChild(pieceEl);

            const pieceClientRect = pieceEl.getBoundingClientRect();
            const pieceHeight = pieceClientRect.height;
            const pieceWidth = pieceClientRect.width;

            for (let i = 0; i < 20; i++) {
                const randomX =
                    Math.round(randBetween(minX, maxX - pieceWidth));
                const randomY =
                    Math.round(randBetween(minY, maxY - pieceHeight));
                pieceEl.setAttribute(
                    'transform',
                    `translate(${randomX} ${randomY})`);

                const intersectsBoard =
                    boxesIntersect(
                        pieceEl.getBoundingClientRect(),
                        boardClientRect);
                if (!intersectsBoard) {
                    break;
                }
            }
        }

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
