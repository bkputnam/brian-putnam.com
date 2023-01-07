import {compare} from './compare.js';

const groups = new Array(Math.pow(3, 5));

function getExpectedRemainingWords(wordlist, word) {
    groups.fill(0);
    const len = wordlist.length;
    let actualWord = '';
    for (let i=0; i<len; i++) {
        actualWord = wordlist[i];
        const result = compare(word, actualWord).valueNum();
        groups[result]++;
    }

    let sum = 0;
    let numWords = 0;
    for (const size of groups) {
        sum += size * size;
        numWords += size;
    }
    return sum / numWords;
}

export function getNextGuess(wordlist) {
    let minExpectedRemainingWords = Number.POSITIVE_INFINITY;
    let nextGuess = '---';

    const startMs = performance.now();

    const len = wordlist.length;
    for (let i=0; i<len; i++) {
        const word = wordlist[i];
        const expectedRemainingWords = getExpectedRemainingWords(wordlist, word);
        if (expectedRemainingWords < minExpectedRemainingWords) {
            minExpectedRemainingWords = expectedRemainingWords;
            nextGuess = word;
        }
    }

    const endMs = performance.now();
    const elapsedMs = endMs - startMs;
    console.log(`Picked next guess "${nextGuess}" in ${elapsedMs} ms`);
    console.log(`Expected remaining words after "${nextGuess}": ${minExpectedRemainingWords}`);

    return nextGuess;
}
