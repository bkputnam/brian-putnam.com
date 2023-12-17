import { WORD_SIZE } from "../data/solutions.js";
import { Board } from "../data_structures/board.js";
import { Piece } from "../data_structures/piece.js";
import { Solution } from "../data_structures/solution.js";
import { BoardCoord, ScreenCoord } from '../data_structures/coord.js';
import { PlayAreaController } from "./play_area_controller.js";
import { PieceController } from "./piece_controller.js";

export class PlayAreaModel {
    readonly board: Board;
    readonly placedPieces = new Map<PieceController, BoardCoord>();
    readonly unplacedPieces = new Map<PieceController, ScreenCoord>();
    readonly solutionCoords = new Map<PieceController, BoardCoord>();

    constructor(
        readonly playAreaController: PlayAreaController,
        readonly solution: Solution) {
        let x = 0, y = 0;
        const { startingBoard, pieces } = solution.toRandomPieces();
        this.board = startingBoard;
        for (const { piece, coord: solutionCoord } of pieces) {
            const startingCoord: ScreenCoord = { x, y };
            const pieceController = new PieceController(piece);
            this.unplacedPieces.set(pieceController, startingCoord);
            x += 60;
            y += 60;
        }
    }
}