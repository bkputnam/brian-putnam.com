
export const CompareValue = {
    NOT_USED: 0,
    WRONG_LOCATION: 1,
    RIGHT_LOCATION: 2,
};

export class CompareResult {
    constructor(guess, values) {
        this.guess = guess;
        this.values = values;
    }

    static fromString(guess, str) {
        return new CompareResult(guess, str.split('').map((char) => {
            switch (char) {
                case '_':
                    return CompareValue.NOT_USED;
                case '?':
                    return CompareValue.WRONG_LOCATION;
                case '.':
                    return CompareValue.RIGHT_LOCATION;
                default:
                    throw new Error(`Unexpected CompareResult string: ${char}`);
            }
        }));
    }

    valueStr() {
        return this.values.map((value) => {
            switch (value) {
                case CompareValue.NOT_USED:
                    return '_';
                case CompareValue.WRONG_LOCATION:
                    return '?';
                case CompareValue.RIGHT_LOCATION:
                    return '.';
            }
        }).join('');
    }

    valueNum() {
        let result = 0;
        let power = 1; // 3^0 == 1
        for (let index=0; index<this.values.length; index++) {
            const digit = this.values[index];
            result += power * digit;
            power *= 3;
        }
        return result;
    }

    toString() {
        return `${this.guess}|${this.valueStr()}`;
    }
}

export function compare(guess, actual) {
    if (guess.length !== actual.length) {
        throw new Error(`Guess was wrong length: expected ${actual.length}, got ${guess.length}`);
    }
    const values = [];
    for (let i=0; i<guess.length; i++) {
        const char = guess.charAt(i);
        if (actual.charAt(i) === char) {
            values.push(CompareValue.RIGHT_LOCATION);
        } else if (actual.indexOf(char) !== -1) {
            values.push(CompareValue.WRONG_LOCATION);
        } else {
            values.push(CompareValue.NOT_USED);
        }
    }
    return new CompareResult(guess, values);
}