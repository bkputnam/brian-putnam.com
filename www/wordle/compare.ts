
export enum CompareValue {
    NOT_USED = 0,
    WRONG_LOCATION,
    RIGHT_LOCATION,
}

export class CompareResult {
    constructor(readonly guess: string, readonly values: CompareValue[]) {}

    static fromString(guess: string, str: string) {
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

    static valueNum(values: CompareValue[]): number {
        let result = 0;
        let power = 1; // 3^0 == 1
        for (let index=0; index<values.length; index++) {
            const digit = values[index] as number;
            result += power * digit;
            power *= 3;
        }
        return result;
    }

    static fromValueNum(str: string, valueNum: number): CompareResult {
        const values: CompareValue[] = [];
        for (let i = 0; i < 5; i++) {
            const digit = valueNum % 3;
            values.push(digit);
            valueNum = (valueNum - digit) / 3;
        }
        return new CompareResult(str, values);
    }

    valueStr(): string {
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

    valueNum(): number {
        return CompareResult.valueNum(this.values);
    }
    
    isAllCorrect() {
        return this.values.every(
            (value) => value === CompareValue.RIGHT_LOCATION);
    }

    toString(): string {
        return `${this.guess}|${this.valueStr()}`;
    }
}

const values: CompareValue[] = new Array(5);
const usedGuessChars: boolean[] = new Array(5);
const usedActualChars: boolean[] = new Array(5);

// compareToNum can slightly faster than compare because we can
// compute the result directly from the global `values` array,
// without constructing a new CompareResult and copying `values`
// into it.
export function compareAsNum(guess: string, actual: string): number {
    if (guess.length !== actual.length) {
        throw new Error(`Guess was wrong length: expected ${actual.length}, got ${guess.length}`);
    }

    // First look for chars in the right place because they provide
    // the most info. We must do all of these first so that an earlier
    // out-of-place char doesn't use this input char before we can get
    // to it.
    for (let i = 0; i < 5; i++) {
        // Optimization: initialize global variables in this loop
        // instead of a separate loop or Array.fill
        values[i] = CompareValue.NOT_USED;

        // I think charCodeAt will be faster than charAt because
        // it doesn't have to allocate a new string
        if (guess.charCodeAt(i) === actual.charCodeAt(i)) {
            values[i] = CompareValue.RIGHT_LOCATION;

            // Mark the characters as having been already used
            usedGuessChars[i] = true;
            usedActualChars[i] = true;
        } else {
            // Optimization: initialize global variables in this loop
            // instead of a separate loop or Array.fill
            usedGuessChars[i] = false;
            usedActualChars[i] = false;
        }
    }

    // Next look for misplaced chars
    // The remainers are unused chars
    for (let guessIndex = 0; guessIndex < 5; guessIndex++) {
        if (usedGuessChars[guessIndex]) {
            continue;
        }

        for (let actualIndex = 0; actualIndex < 5; actualIndex++) {
            if (usedActualChars[actualIndex]) {
                continue;
            }
            if (guess.charCodeAt(guessIndex) === actual.charCodeAt(actualIndex)) {
                values[guessIndex] = CompareValue.WRONG_LOCATION;
                usedGuessChars[guessIndex] = true;
                usedActualChars[actualIndex] = true;
            }
        }
    }
    return CompareResult.valueNum(values);
}

export function compare(guess: string, actual: string): CompareResult {
    return CompareResult.fromValueNum(guess, compareAsNum(guess, actual));
}