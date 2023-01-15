import { CompareValue } from "./compare.js";
import { range } from "./iter.js";
function countChar(str, char) {
    const len = str.length;
    const charCode = char.charCodeAt(0);
    let count = 0;
    for (let i = 0; i < len; i++) {
        if (str.charCodeAt(i) === charCode) {
            count++;
        }
    }
    return count;
}
function toOrdinalStr(num) {
    switch (num) {
        case 0:
            return '1st';
        case 1:
            return '2nd';
        case 2:
            return '3rd';
        default:
            return `${num + 1}th`;
    }
}
class CharNeverUsed {
    nth;
    char;
    indexes;
    constructor(nth, char, indexes) {
        this.nth = nth;
        this.char = char;
        this.indexes = indexes;
    }
    matches(str) {
        const result = countChar(str, this.char) <= this.nth ||
            !this.indexes.some((index) => str.charAt(index) === this.char);
        // if (!result) {
        //     debugger;
        // }
        // console.log(`${this.toString()} = ${result}`);
        return result;
    }
    toString() {
        return `CharNeverUsed(${toOrdinalStr(this.nth)} ${this.char}, [${this.indexes}])`;
    }
}
class CharUsedElsewhere {
    nth;
    char;
    notIndex;
    indexes;
    constructor(nth, char, notIndex, indexes) {
        this.nth = nth;
        this.char = char;
        this.notIndex = notIndex;
        this.indexes = indexes.filter((index) => index !== notIndex);
    }
    matches(str) {
        const result = countChar(str, this.char) >= this.nth &&
            str.charAt(this.notIndex) !== this.char &&
            this.indexes.some((index) => str.charAt(index) === this.char);
        // if (!result) {
        //     debugger;
        // }
        // console.log(`${this.toString()} = ${result}`);
        return result;
    }
    toString() {
        return `CharUsedElsewhere(${toOrdinalStr(this.nth)} ${this.char}, ${this.notIndex}, [${this.indexes}])`;
    }
}
class CharAtIndex {
    char;
    index;
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
    filters = [];
    addCompareResult(compareResult) {
        const remainingIndexes = [...range(5)];
        const compareValues = [...compareResult.values.entries()];
        const letters = compareResult.guess.split('');
        const filters = new Array(5);
        filters.fill(undefined);
        const nthChar = new Map();
        const getCharCount = (char) => {
            const result = nthChar.has(char) ?
                nthChar.get(char) : 0;
            nthChar.set(char, result + 1);
            return result;
        };
        for (const [index, value] of compareValues) {
            if (value === CompareValue.RIGHT_LOCATION) {
                filters[index] = new CharAtIndex(letters[index], index);
                remainingIndexes.splice(index, 1);
                getCharCount(letters[index]);
            }
        }
        for (const [index, value] of compareValues) {
            if (value === CompareValue.WRONG_LOCATION) {
                filters[index] = new CharUsedElsewhere(getCharCount(letters[index]), letters[index], index, [...remainingIndexes]);
                // remainingIndexes.splice(index, 1);
            }
        }
        for (let i = 0; i < filters.length; i++) {
            const filter = filters[i];
            if (filter === undefined) {
                filters[i] = new CharNeverUsed(getCharCount(letters[i]), letters[i], remainingIndexes);
            }
        }
        for (const filter of filters) {
            this.filters.push(filter);
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
//# sourceMappingURL=state_filters.js.map