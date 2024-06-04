import { WORD_SIZE } from "../data/solutions.js";
import { WORD_LIST } from "../data/word_list.js";
import { BoardCoord, LetterCoord } from "./coord.js";
import { Piece } from "./piece.js";

const wordSet = new Set(WORD_LIST);

export class Board {
    private readonly gridPieces: Array<Array<Piece | null>>;
    private readonly pieceLocations = new Map<Piece, BoardCoord>();

    constructor(readonly size: number) {
        const grid: typeof this.gridPieces = [];
        for (let i = 0; i < size; i++) {
            grid.push(new Array(size).fill(null));
        }
        this.gridPieces = grid;
    }

    static fromStringArray(letters: string[][]): Board {
        const result = new Board(letters.length);
        for (let row = 0; row < letters.length; row++) {
            for (let col = 0; col < letters.length; col++) {
                const letter = letters[row][col];
                result.tryPlacePiece(Piece.fromString(letter), { row, col });
            }
        }
        return result;
    }

    getPieceAtCoord(coord: BoardCoord): Piece | null {
        return this.gridPieces[coord.row][coord.col];
    }

    getLetterAtCoord(coord: BoardCoord): string | null {
        const piece = this.getPieceAtCoord(coord);
        if (!piece) {
            return null;
        }
        for (const { letter, coord: pieceCoord } of this.iterPieceLetters(piece)) {
            const coordEquals = pieceCoord.row === coord.row &&
                pieceCoord.col === coord.col;
            if (coordEquals) {
                return letter;
            }
        }
        throw new Error('This should be impossible');
    }

    private *iterPieceLetters(piece: Piece, coord?: BoardCoord):
        Iterable<LetterCoord> {
        coord = coord ?? this.pieceLocations.get(piece);
        if (!coord) {
            return;
        }
        for (const { letter, coord: pieceCoord } of piece.iterCoords()) {
            const resultCoord = {
                row: coord.row + pieceCoord.row,
                col: coord.col + pieceCoord.col,
            };
            yield { letter, coord: resultCoord };
        }
    }

    private isCoordInBounds(coord: BoardCoord): boolean {
        return coord.row >= 0 && coord.row < this.gridPieces.length
            && coord.col >= 0 && coord.col < this.gridPieces[0].length;
    }

    private isPieceInBounds(piece: Piece, coord: BoardCoord): boolean {
        if (!this.isCoordInBounds(coord)) {
            return false;
        }
        const maxCoord = {
            row: coord.row + piece.height - 1,
            col: coord.col + piece.width - 1,
        };
        return this.isCoordInBounds(maxCoord);
    }

    tryPlacePiece(piece: Piece, coord: BoardCoord): boolean {
        if (!this.isPieceInBounds(piece, coord)) {
            return false;
        }
        const letterCoords = [...this.iterPieceLetters(piece, coord)];
        for (const { coord: pieceCoord } of letterCoords) {
            if (this.gridPieces[pieceCoord.row][pieceCoord.col] !== null) {
                return false;
            }
        }
        // Prevents issues when repeatedly trying to place the same tetrominoes
        // on the board in different places.
        if (this.pieceLocations.has(piece)) {
            piece = piece.clone();
        }
        this.pieceLocations.set(piece, coord);
        for (const { coord: pieceCoord } of letterCoords) {
            this.gridPieces[pieceCoord.row][pieceCoord.col] = piece;
        }
        return true;
    }

    /**
     * Removes a Piece from the board.
     * 
     * coord usually isn't needed, but can be passed in situations where the
     * board doesn't know the location of the Piece, e.g. if the board
     * represents a solution that hasn't yet been broken up into Pieces.
     */
    clearPiece(piece: Piece, coord?: BoardCoord) {
        for (const { coord: pieceCoord } of this.iterPieceLetters(piece, coord)) {
            const pieceAtCoord =
                this.gridPieces[pieceCoord.row][pieceCoord.col]!;
            this.pieceLocations.delete(pieceAtCoord);
            this.gridPieces[pieceCoord.row][pieceCoord.col] = null;
        }
    }

    isComplete(): boolean {
        const letterGrid = this.letterGrid();
        for (let row = 0; row < WORD_SIZE; row++) {
            const word =
                letterGrid[row][0] +
                letterGrid[row][1] +
                letterGrid[row][2] +
                letterGrid[row][3] +
                letterGrid[row][4];

            if (!wordSet.has(word.toLowerCase())) {
                return false;
            }
        }

        for (let col = 0; col < WORD_SIZE; col++) {
            const word =
                letterGrid[0][col] +
                letterGrid[1][col] +
                letterGrid[2][col] +
                letterGrid[3][col] +
                letterGrid[4][col];
            if (!wordSet.has(word.toLowerCase())) {
                return false;
            }
        }

        return true;
    }

    private letterGrid(): string[][] {
        const letterGrid: string[][] = this.gridPieces
            .map((row: Array<Piece | null>) => row.map((cell: Piece) => '_'));
        for (const [piece, pieceCoord] of this.pieceLocations.entries()) {
            for (const { letter, coord: letterCoord } of
                this.iterPieceLetters(piece, pieceCoord)) {
                letterGrid[letterCoord.row][letterCoord.col] = letter;
            }
        }
        return letterGrid;
    }

    toString(): string {

        return this.letterGrid()
            .map((row: string[]) => row.join(' ')).join('\n');
    }
}