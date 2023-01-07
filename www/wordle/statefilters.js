import { compare, CompareResult, CompareValue } from "./compare.js";

class CharNeverUsed {
    constructor(char, indexes) {
        this.char = char;
        this.indexes = indexes;
    }

    matches(str) {
        const result =
            !this.indexes.some((index) => str.charAt(index) === this.char);
        // console.log(`${this.toString()} = ${result}`);
        return result;
    }

    toString() {
        return `CharNeverUsed(${this.char}, [${this.indexes}])`;
    }
}

class CharUsedElsewhere {
    constructor(char, notIndex, indexes) {
        this.char = char;
        this.notIndex = notIndex;
        this.indexes = indexes.filter((index) => index !== notIndex);
    }

    matches(str) {
        const result = str.indexOf(this.char) !== -1 &&
            this.indexes.some((index) => str.charAt(index) === this.char);
        // console.log(`${this.toString()} = ${result}`);
        return result;
    }

    toString() {
        return `CharUsedElsewhere(${this.char}, ${this.notIndex}, [${this.indexes}])`;
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

    createFilter(char, index, value, unknownLetters) {
        switch (value) {
            case CompareValue.NOT_USED:
                return new CharNeverUsed(char, unknownLetters);
            case CompareValue.WRONG_LOCATION:
                return new CharUsedElsewhere(char, index, unknownLetters);
            case CompareValue.RIGHT_LOCATION:
                // I don't remember why this was necessary
                // const indexIndex = unknownLetters.indexOf(index);
                // if (indexIndex !== -1) {
                //     unknownLetters.splice(indexIndex, 1);
                // }
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
        for (const [index, value] of compareResult.values.entries()) {
            const char = compareResult.guess.charAt(index);
            this.filters.push(this.createFilter(char, index, value, unknownLetters));
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