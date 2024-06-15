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

    static emptyWithSize(width: number, height: number): Piece {
        const nullGrid = new Array<Array<string | null>>(height);
        for (let row = 0; row < height; row++) {
            const rowArr = new Array<string | null>(width);
            rowArr.fill(null);
            nullGrid[row] = rowArr;
        }
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

    /** Returns all letters in a 4x4 grid */
    getLetterGrid(): Array<Array<string | null>> {
        // Defensive copy
        return JSON.parse(
            JSON.stringify(this.letterGrid)) as Array<Array<string | null>>;
    }

    countLetters(): number {
        let letterCount = 0;
        for (const row of this.letterGrid) {
            for (const letter of row) {
                if (letter !== null) {
                    letterCount++;
                }
            }
        }
        return letterCount;
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