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
        const { startingBoard, pieces } = solution.getStartingBoardAndPieces();
        this.board = startingBoard;

        for (const { piece, coord: solutionCoord } of pieces) {
            const pieceController = new PieceController(this.board, piece);
            this.pieces.add(pieceController);
            this.solutionCoords.set(pieceController, solutionCoord);
        }
    }

    notifyBoardComplete(board: Board): void {
        this.playAreaController.notifyBoardComplete(board);
    }

    removePiece(piece: PieceController): void {
        this.pieces.delete(piece);
        this.solutionCoords.delete(piece);
    }

    placePieceRandomly(piece: PieceController) {
        this.playAreaController.placePieceRandomly(piece);
    }
}
