import { compare } from './compare.js';
import { wordlist } from './wordlist.js';

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

export function getNextGuess(remainingWords) {
    if (remainingWords.length === 0) {
        throw new Error(`Cannot create a guess with an empty word list.`);
    } else if (remainingWords.length === 1) {
        // Maybe we should throw here? If we wind up in this situation we
        // missed a check somewhere earlier on.
        return remainingWords[0];
    }
    let minExpectedRemainingWords = Number.POSITIVE_INFINITY;
    let nextGuess = '---';
    let foundSomething = false;
    const remainingWordsSet = new Set(remainingWords);

    const startMs = performance.now();

    const len = wordlist.length;
    for (let i=0; i<len; i++) {
        const word = wordlist[i];
        const isPlausibleWord = remainingWordsSet.has(word);
        const expectedRemainingWords = getExpectedRemainingWords(remainingWords, word);
        if (expectedRemainingWords < minExpectedRemainingWords
            || (expectedRemainingWords === minExpectedRemainingWords && isPlausibleWord)) {
            minExpectedRemainingWords = expectedRemainingWords;
            nextGuess = word;
            foundSomething = true;
        }
    }

    const endMs = performance.now();
    const elapsedMs = endMs - startMs;
    console.log(`Picked next guess "${nextGuess}" in ${elapsedMs} ms`);
    console.log(`Expected remaining words after "${nextGuess}": ${minExpectedRemainingWords}`);

    return nextGuess;
}
