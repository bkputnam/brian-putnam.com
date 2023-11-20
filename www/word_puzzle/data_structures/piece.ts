import { BoardCoord, LetterCoord } from "./coord.js";

export class Piece {
    readonly width: number;
    readonly height: number;

    constructor(private readonly letterGrid: Array<Array<string | null>>) {
        this.height = this.letterGrid.length;
        if (this.height === 0) {
            throw new Error(`letterGrid cannot have 0 rows`);
        }
        this.width = this.letterGrid[0].length;
        if (this.width === 0) {
            throw new Error(`letterGrid cannot have 0 cols`);
        }
    }

    static fromString(str: string): Piece {
        const letterGrid: Array<Array<string | null>> = [[]];
        let row = letterGrid[0];
        for (const char of str.split('')) {
            if (char === '_') {
                row.push(null);
            } else if (char === '\n') {
                row = [];
                letterGrid.push(row);
            } else {
                row.push(char);
            }
        }
        let width = -1;
        for (const row of letterGrid) {
            if (width === -1) {
                width = row.length;
            } else if (row.length != width) {
                throw new Error(
                    `Row lengths must be equal ` +
                    `(expected ${width}, got ${row.length})`);
            }
        }
        return new Piece(letterGrid);
    }

    static emptyFromTemplate(template: Piece): Piece {
        const nullGrid =
            template.letterGrid.map(
                (row: Array<string | null>) =>
                    row.map((val: string | null) => null));
        return new Piece(nullGrid);
    }

    clone(): Piece {
        return new Piece(this.letterGrid.map((row) => [...row]));
    }

    setLetter(letter: string, coord: BoardCoord): void {
        this.letterGrid[coord.row][coord.col] = letter;
    }

    toString(): string {
        return this.letterGrid
            .map((row) => row
                .map((letter: string | null) => letter === null ? '_' : letter)
                .join(''))
            .join('\n');
    }

    *iterCoords(): Iterable<LetterCoord> {
        for (let row = 0; row < this.letterGrid.length; row++) {
            for (let col = 0; col < this.letterGrid[0].length; col++) {
                const letter = this.letterGrid[row][col];
                if (letter !== null) {
                    yield {
                        letter,
                        coord: { row, col },
                    };
                }
            }
        }
    }
}