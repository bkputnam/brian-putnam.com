import { BoardCoord, LetterCoord } from "./coord.js";
import { Piece } from "./piece.js";

class OutOfBoundsError extends Error {
    constructor(coord: BoardCoord) {
        super(`Piece out of bounds: coord = ` +
            `[${coord.row}, ${coord.col}]`);
    }
}

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
            throw new Error(`Failed to find piece in this.pieceLocations`);
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

    clearPiece(piece: Piece, coord: BoardCoord) {
        for (const { coord: pieceCoord } of this.iterPieceLetters(piece, coord)) {
            const pieceAtCoord =
                this.gridPieces[pieceCoord.row][pieceCoord.col]!;
            if (pieceAtCoord.height !== 1 || pieceAtCoord?.width !== 1) {
                throw new Error('clearPiece only works with 1x1 pieces');
            }
            this.pieceLocations.delete(pieceAtCoord);
            this.gridPieces[pieceCoord.row][pieceCoord.col] = null;
        }
    }

    toString(): string {
        const letterGrid: string[][] = this.gridPieces
            .map((row: Array<Piece | null>) => row.map((cell: Piece) => '_'));
        for (const [piece, pieceCoord] of this.pieceLocations.entries()) {
            for (const { letter, coord: letterCoord } of
                this.iterPieceLetters(piece, pieceCoord)) {
                letterGrid[letterCoord.row][letterCoord.col] = letter;
            }
        }
        return letterGrid.map((row: string[]) => row.join(' ')).join('\n');
    }
}