import { Board } from "./board.js";
import { Coord, LetterCoord } from "./coord.js";
import { Piece } from "./piece.js";
import { shuffleInPlace } from "./random.js";
import { TETROMINOES } from "./tetrominoes.js";

export class Solution {
    private readonly grid: string[][];

    constructor(str: string) {
        this.grid = str.split('\n').map((rowStr: string) => rowStr.split(''));
        const sideLen = this.grid.length;
        for (const row of this.grid) {
            if (row.length !== sideLen) {
                throw new Error('Solution must be a square');
            }
        }
    }

    private *iterCoords(): Iterable<Coord> {
        for (let row = 0; row < this.grid.length; row++) {
            for (let col = 0; col < this.grid.length; col++) {
                yield { row, col };
            }
        }
    }

    makePieceFromTemplate(template: Piece, coord: Coord): Piece {
        const result = Piece.emptyFromTemplate(template);
        for (const { coord: pieceCoord } of template.iterCoords()) {
            const boardCoord: Coord = {
                row: coord.row + pieceCoord.row,
                col: coord.col + pieceCoord.col,
            };
            const letter = this.grid[boardCoord.row][boardCoord.col];
            result.setLetter(letter, pieceCoord);
        }
        return result;
    }

    toRandomPieces(): Array<{ piece: Piece, coord: Coord; }> {
        // Used when trying to place random tetrominoes to tell whether or not
        // we've already placed on that spot.
        const placementBoard = new Board(this.grid.length);
        // Used to keep track of which cells we haven't assigned by the end.
        // Starts full and is progressively cleared. Represents the player's
        // starting board.
        const startingBoard = Board.fromStringArray(this.grid);
        const result: Array<{ piece: Piece, coord: Coord; }> = [];

        const tetrominoes = [...TETROMINOES];
        const coords = [...this.iterCoords()];

        const placeRandomPiece = () => {
            for (const tetromino of shuffleInPlace(tetrominoes)) {
                for (const coord of shuffleInPlace(coords)) {
                    if (placementBoard.tryPlacePiece(tetromino, coord)) {
                        result.push({
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
        console.log(startingBoard.toString());
        return result;
    }
}