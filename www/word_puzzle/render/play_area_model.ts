import { Board } from "../data_structures/board.js";
import { Solution } from "../data_structures/solution.js";
import { BoardCoord, ScreenCoord } from '../data_structures/coord.js';
import { PlayAreaController } from "./play_area_controller.js";
import { PieceController } from "./piece_controller.js";

export class PlayAreaModel {
    readonly board: Board;
    readonly pieces = new Set<PieceController>();
    readonly solutionCoords = new Map<PieceController, BoardCoord>();

    constructor(
        readonly playAreaController: PlayAreaController,
        readonly solution: Solution) {
        const { startingBoard, pieces } = solution.toRandomPieces();
        this.board = startingBoard;

        for (const { piece, coord: solutionCoord } of pieces) {
            const pieceController = new PieceController(piece);
            this.pieces.add(pieceController);
            this.solutionCoords.set(pieceController, solutionCoord);
        }
    }
}
