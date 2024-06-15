import { Board } from "../data_structures/board.js";
import { Solution } from "../data_structures/solution.js";
import { DomRectLike, boxesIntersect } from "../util/geometry.js";
import { randBetween } from "../util/random.js";
import { Resolver } from "../util/resolver.js";
import { BoardController } from "./board_controller.js";
import { Controller } from "./controller.js";
import { PlayAreaModel } from "./play_area_model.js";

export class PlayAreaController extends Controller {
    readonly model: PlayAreaModel;
    readonly boardController: BoardController;

    private boardCompleteResolver = new Resolver<Board>();

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
            -(boardClientRect.width * 1.5));
        const maxX = Math.min(
            topSvgClientRect.width / 2,
            (boardClientRect.width * 1.5));
        const minY = 1;
        const maxY = Math.min(
            topSvgClientRect.height - 1,
            boardClientRect.height * 3);

        const intersectsAny = (pieceEl: SVGGraphicsElement): boolean => {
            const pieceBB = pieceEl.getBoundingClientRect();
            if (boxesIntersect(pieceBB, boardClientRect)) {
                return true;
            }

            for (const placedBB of placedBBs) {
                if (boxesIntersect(pieceBB, placedBB)) {
                    return true;
                }
            }
            return false;
        };

        const placedBBs: DomRectLike[] = [];
        let pieceNumber = 1;
        for (const pieceController of this.model.pieces) {
            const pieceEl = pieceController.render();
            centeringSvg.appendChild(pieceEl);
            pieceEl.classList.add('p' + pieceNumber % 6);
            pieceNumber++;

            const pieceClientRect = pieceEl.getBoundingClientRect();
            const pieceHeight = pieceClientRect.height;
            const pieceWidth = pieceClientRect.width;

            for (let i = 0; i < 100; i++) {
                const randomX =
                    Math.round(randBetween(minX, maxX - pieceWidth));
                const randomY =
                    Math.round(randBetween(minY, maxY - pieceHeight));
                pieceEl.setAttribute(
                    'transform',
                    `translate(${randomX} ${randomY})`);

                if (!intersectsAny(pieceEl)) {
                    break;
                }
            }
            // Recompute getBoundingClientRect in final position
            placedBBs.push(pieceEl.getBoundingClientRect());
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

    onBoardComplete(): Promise<Board> {
        return this.boardCompleteResolver.promise;
    }

    notifyBoardComplete(board: Board): void {
        this.getElStrict().classList.add('solved');
        this.boardCompleteResolver.resolve(board);
    }
}
