import { Board } from "./board.js";
import { BoardCoord, LetterCoord } from "./coord.js";
import { Piece } from "./piece.js";
import { shuffleInPlace } from "../util/random.js";
import { TETROMINOES } from "../data/tetrominoes.js";
import { WORD_SIZE } from "../data/solutions.js";

export class Solution {
    private readonly grid: string[][];

    constructor(str: string) {
        this.grid = str
            .split('\n')
            .map((rowStr: string) =>
                rowStr.split('').map((char: string) => char.toUpperCase()));
        const sideLen = this.grid.length;
        for (const row of this.grid) {
            if (row.length !== sideLen) {
                throw new Error('Solution must be a square');
            }
        }
    }

    private *iterCoords(): Iterable<BoardCoord> {
        for (let row = 0; row < this.grid.length; row++) {
            for (let col = 0; col < this.grid.length; col++) {
                yield { row, col };
            }
        }
    }

    private makePieceFromTemplate(template: Piece, coord: BoardCoord): Piece {
        const result = Piece.emptyFromTemplate(template);
        for (const { coord: pieceCoord } of template.iterCoords()) {
            const boardCoord: BoardCoord = {
                row: coord.row + pieceCoord.row,
                col: coord.col + pieceCoord.col,
            };
            const letter = this.grid[boardCoord.row][boardCoord.col];
            result.setLetter(letter, pieceCoord);
        }
        return result;
    }

    toRandomPieces(): {
        startingBoard: Board,
        pieces: Array<{ piece: Piece, coord: BoardCoord; }>;
    } {
        // Used when trying to place random tetrominoes to tell whether or not
        // we've already placed on that spot.
        const placementBoard = new Board(this.grid.length);
        // Used to keep track of which cells we haven't assigned by the end.
        // Starts full and is progressively cleared. Represents the player's
        // starting board.
        const startingBoard = Board.fromStringArray(this.grid);
        const pieces: Array<{ piece: Piece, coord: BoardCoord; }> = [];

        const tetrominoes = [...TETROMINOES];
        const coords = [...this.iterCoords()];

        const placeRandomPiece = () => {
            for (const tetromino of shuffleInPlace(tetrominoes)) {
                for (const coord of shuffleInPlace(coords)) {
                    if (placementBoard.tryPlacePiece(tetromino, coord)) {
                        pieces.push({
                            piece: this.makePieceFromTemplate(tetromino, coord),
                            coord,
                        });
                        startingBoard.clearPiece(tetromino, coord);
                        return true;
                    }
                }
            }
            return false;
        };

        while (placeRandomPiece()) { }
        for (const { piece, coord } of this.leftoversToPieces(startingBoard)) {
            pieces.push({ piece, coord });
            startingBoard.clearPiece(piece, coord);
        }
        console.log(startingBoard.toString());
        return { startingBoard, pieces };
    }

    private *leftoversToPieces(startingBoard: Board):
        Iterable<{ piece: Piece, coord: BoardCoord }> {
        for (let row = 0; row < WORD_SIZE; row++) {
            for (let col = 0; col < WORD_SIZE; col++) {
                const coord = { row, col };
                if (startingBoard.getLetterAtCoord(coord) === null) {
                    continue;
                }
                const pieceCoords =
                    [...this.iterGroupCoords(startingBoard, coord)];
                const boundingBox = this.getBoundingBox(pieceCoords);
                const piece = Piece
                    .emptyWithSize(boundingBox.width, boundingBox.height);
                for (const pieceCoord of pieceCoords) {
                    const letter = startingBoard.getLetterAtCoord(pieceCoord);
                    if (letter != null) {
                        piece.setLetter(letter, {
                            row: pieceCoord.row - boundingBox.row,
                            col: pieceCoord.col - boundingBox.col,
                        });
                    }
                }
                yield {
                    piece,
                    coord: {
                        row: boundingBox.row,
                        col: boundingBox.col,
                    },
                };
            }
        }
    }

    private *iterGroupCoords(startingBoard: Board, startingCoord: BoardCoord):
        Iterable<BoardCoord> {
        const coordsToCheck = [startingCoord];
        const visitedCoords = new Array<Array<boolean>>(WORD_SIZE);
        for (let row = 0; row < WORD_SIZE; row++) {
            const rowArr = new Array<boolean>(WORD_SIZE);
            rowArr.fill(false);
            visitedCoords[row] = rowArr;
        }

        while (coordsToCheck.length > 0) {
            const coord = coordsToCheck.pop()!;
            visitedCoords[coord.row][coord.col] = true;
            yield coord;

            for (const neighbor of this.iterNeighbors(coord)) {
                if (!visitedCoords[neighbor.row][neighbor.col]
                    && startingBoard.getLetterAtCoord(neighbor) !== null) {
                    coordsToCheck.push(neighbor);
                }
            }
        }
    }

    private *iterNeighbors(coord: BoardCoord): Iterable<BoardCoord> {
        for (const offset of NEIGHBOR_OFFSETS) {
            const newCoord = {
                row: coord.row + offset.row,
                col: coord.col + offset.col,
            };
            if (isValidCoord(newCoord)) {
                yield newCoord;
            }
        }
    }

    private getBoundingBox(coords: Iterable<BoardCoord>): BoardRect {
        let minRow = Number.POSITIVE_INFINITY;
        let maxRow = Number.NEGATIVE_INFINITY;
        let minCol = Number.POSITIVE_INFINITY;
        let maxCol = Number.NEGATIVE_INFINITY;

        for (const coord of coords) {
            if (coord.row < minRow) {
                minRow = coord.row;
            }
            if (coord.row > maxRow) {
                maxRow = coord.row;
            }
            if (coord.col < minCol) {
                minCol = coord.col;
            }
            if (coord.col > maxCol) {
                maxCol = coord.col;
            }
        }
        return {
            row: minRow,
            col: minCol,
            width: maxCol - minCol + 1,
            height: maxRow - minRow + 1,
        };
    }
}

interface BoardRect {
    row: number;
    col: number;
    width: number;
    height: number;
}

function isValidCoord(coord: BoardCoord): boolean {
    return coord.row >= 0 && coord.col >= 0 &&
        coord.row < WORD_SIZE && coord.col < WORD_SIZE;
}

const NEIGHBOR_OFFSETS = [
    { row: -1, col: 0 }, // above
    { row: 1, col: 0 }, // below
    { row: 0, col: -1 }, // left
    { row: 0, col: 1 }, // right
];
