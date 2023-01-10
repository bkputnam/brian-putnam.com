import { compare, CompareResult, CompareValue } from "./compare.js";

/**
 * Get the index of the nth instance of subStr
 */
function nthIndex(str, subStr, n) {
    let result = undefined;
    let searchStart = 0;
    for (let i=0; i<=n; i++) {
        result = str.indexOf(subStr, searchStart);
        if (result === -1) {
            break;
        }
        searchStart = result + subStr.length;
    }
    if (result === undefined) {
        throw new Error(`Index = undefined (n=${n})`);
    }
    return result;
}

class CharNeverUsed {
    constructor(index, char, indexes) {
        this.index = index;
        this.char = char;
        this.indexes = indexes
    }

    matches(str) {
        const result = nthIndex(str, this.char, this.index) === -1;
        // console.log(`${this.toString()} = ${result}`);
        return result;
    }

    toString() {
        return `CharNeverUsed(${this.index}, ${this.char}, [${this.indexes}])`;
    }
}

class CharUsedElsewhere {
    constructor(index, char, notIndex, indexes) {
        this.index = index;
        this.char = char;
        this.notIndex = notIndex;
        this.indexes = indexes.filter((index) => index !== notIndex);
    }

    matches(str) {
        const nthCharIndex = nthIndex(str, this.char, this.index);
        const result = this.indexes.includes(nthCharIndex);
        // console.log(`${this.toString()} = ${result}`);
        return result;
    }

    toString() {
        return `CharUsedElsewhere(${this.index}, ${this.char}, ${this.notIndex}, [${this.indexes}])`;
    }
}

class CharAtIndex {
    constructor(char, index) {
        this.char = char;
        this.index = index;
    }

    matches(str) {
        const result = str.charAt(this.index) === this.char;
        // console.log(`${this.toString()} = ${result}`);
        return result;
    }

    toString() {
        return `CharAtIndex(${this.char}, ${this.index})`;
    }
}

export class StateFilters {
    constructor() {
        this.filters = [];
    }

    createFilter(nthSighting, char, index, value, unknownLetters) {
        switch (value) {
            case CompareValue.NOT_USED:
                return new CharNeverUsed(nthSighting, char, unknownLetters);
            case CompareValue.WRONG_LOCATION:
                return new CharUsedElsewhere(nthSighting, char, index, unknownLetters);
            case CompareValue.RIGHT_LOCATION:
                return new CharAtIndex(char, index);
            default:
                throw new Error(`Unknown CompareValue: ${value}`);
        }
    }

    addCompareResult(compareResult) {
        const unknownLetters = [];
        for (const [index, value] of compareResult.values.entries()) {
            if (value !== CompareValue.RIGHT_LOCATION) {
                unknownLetters.push(index);
            }
        }
        const nthSightingMap = new Map();
        for (const [index, value] of compareResult.values.entries()) {
            const char = compareResult.guess.charAt(index);
            let nthSighting = nthSightingMap.has(char) ?
                nthSightingMap.get(char) + 1 : 0;
            nthSightingMap.set(char, nthSighting);
            this.filters.push(this.createFilter(nthSighting, char, index, value, unknownLetters));
        }
    }

    matches(guess) {
        return this.filters.every((filter) => filter.matches(guess));
    }

    toString() {
        const filterStr = this.filters.map(filter => '  ' + filter.toString()).join('\n');
        return `[${filterStr}]`;
    }
}
