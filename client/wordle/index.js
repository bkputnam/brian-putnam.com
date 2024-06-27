import { CompareResult } from "./compare.js";
import { getNextGuess } from "./next_guess.js";
import { wordlist } from './wordlist.js';
import { StateFilters } from "./state_filters.js";

// Named element references
const guessesScrollContainer =
    document.getElementById('guesses-scroll-ctr');
const guesses =
    document.getElementById('guesses');
const inputCharNotUsed = document.getElementById('char-not-used');
const inputCharUsedElsewhere =
    document.getElementById('char-used-elsewhere');
const inputCharUsedHere =
    document.getElementById('char-used-here');
const errMsgEl = document.getElementById('err-msg');
const winMsgEl = document.getElementById('win-msg');
const wordsRemainingEl = document.getElementById('words-remaining');

// Event listeners
inputCharNotUsed.addEventListener('click', markNotUsed);
inputCharUsedElsewhere.addEventListener('click', markUsedElsewhere);
inputCharUsedHere.addEventListener('click', markUsedHere);
guesses.addEventListener('click', onClickGuesses);
document.addEventListener('keypress', onKeypress);

function getLastRow() {
    return guesses.querySelector('tr:last-child');
}

function setCursor(el) {
    document.querySelectorAll('.cursor').forEach((el) => {
        el.classList.remove('cursor');
    });
    el.classList.add('cursor');
    return el;
}

function cursorLastRow() {
    const lastRow = getLastRow();
    return setCursor(lastRow.querySelector('td:first-child'));
}

function getCursoredElement() {
    let result = document.querySelectorAll('.cursor');
    if (result.length > 1) {
        throw new Error(`Too many cursors`);
    }
    if (result.length === 1) {
        return result[0];
    }
    return cursorLastRow();
}

function createGuessRow(guess) {
    const tr = document.createElement('tr');
    for (let i = 0; i < 5; i++) {
        const td = document.createElement('td');
        td.innerHTML = guess.charAt(i);
        tr.appendChild(td);
    }
    guesses.appendChild(tr);
    return tr;
}

function charHasFeedback(el) {
    return el.classList.contains('char-not-used') ||
        el.classList.contains('char-used-elsewhere') ||
        el.classList.contains('char-used-here');
}

function advanceCursor() {
    const cursorEl = getCursoredElement();
    const row = cursorEl.parentElement;
    const allTds = [...row.children];
    const startingIndex = allTds.indexOf(cursorEl);
    let index = (startingIndex + 1) % allTds.length;

    // Cursor the next un-feedback'ed TD, looping around if
    // need be
    while (index !== startingIndex) {
        const td = allTds[index];
        if (!charHasFeedback(td)) {
            setCursor(td);
            return;
        }
        index = (index + 1) % allTds.length
    }

    // If we get here, all TDs have feedback
    let feedbackStr = '';
    for (const td of allTds) {
        if (td.classList.contains('char-not-used')) {
            feedbackStr += '_';
        } else if (td.classList.contains('char-used-elsewhere')) {
            feedbackStr += '?';
        } else if (td.classList.contains('char-used-here')) {
            feedbackStr += '.';
        } else {
            throw new Error('This should be impossible');
        }
    }
    acceptFeedback(feedbackStr);
}

function onKeypress(e) {
    switch (e.key) {
        case '_':
            markNotUsed();
            return;
        case '?':
            markUsedElsewhere();
            return;
        case '.':
            markUsedHere();
            return;
    }
}

function onClickGuesses(e) {
    if (e.target.tagName !== 'TD') {
        return;
    }
    setCursor(e.target);
}

function clearCharState(el) {
    el.classList.remove('char-not-used');
    el.classList.remove('char-used-elsewhere');
    el.classList.remove('char-used-here');
}

function markNotUsed() {
    const cursor = getCursoredElement();
    clearCharState(cursor);
    cursor.classList.add('char-not-used');
    advanceCursor();
}

function markUsedElsewhere() {
    const cursor = getCursoredElement();
    clearCharState(cursor);
    cursor.classList.add('char-used-elsewhere');
    advanceCursor();
}

function markUsedHere() {
    const cursor = getCursoredElement();
    clearCharState(cursor);
    cursor.classList.add('char-used-here');
    advanceCursor();
}

let feedbackResolver, feedbackPromise;
function waitForFeedback() {
    if (!feedbackPromise) {
        feedbackPromise = new Promise((resolve) => {
            feedbackResolver = resolve;
        });
        feedbackPromise.finally(() => {
            feedbackResolver = null;
            feedbackPromise = null;
        });
    }
    return feedbackPromise;
}

function acceptFeedback(feedbackStr) {
    const compareResult = CompareResult.fromString(currentGuess, feedbackStr);
    // feedbackResolver will be null after the game is finished
    // because we don't create another row then.
    if (feedbackResolver) {
        feedbackResolver(compareResult);
    }
}

function solveWordle(solution, createNewRow = true) {
    if (createNewRow) {
        const tr = createGuessRow(solution);
        for (let i = 0; i < tr.children.length; i++) {
            const td = tr.children[i];
            td.innerHTML = solution.charAt(i);
            td.classList.add('char-used-here');
        }
    }
    document.querySelectorAll('.hint').forEach((el) => {
        el.classList.add('hide');
    });
    document.querySelectorAll('.cursor').forEach((el) => {
        el.classList.remove('cursor');
    });
    document.querySelector('#inputs').classList.add('hide');
    wordsRemainingEl.classList.add('hide');
    winMsgEl.innerHTML = winMsgEl.innerHTML.replace('{solution}', solution);
    winMsgEl.classList.remove('hide');
}

let currentGuess = 'lares'
async function main() {
    let remainingWords = wordlist;
    createGuessRow(currentGuess);
    getCursoredElement();
    const stateFilters = new StateFilters();
    wordsRemainingEl.innerText = `${remainingWords.length} words remaining`;
    while (remainingWords.length > 1) {
        const compareResult = await waitForFeedback();
        if (compareResult.isAllCorrect()) {
            solveWordle(currentGuess, /* createNewRow= */ false);
            return;
        }
        stateFilters.addCompareResult(compareResult);
        remainingWords = remainingWords.filter(
            (word) => {
                // if (word === 'water') {
                //     debugger;
                // }
                return stateFilters.matches(word);
            });
        wordsRemainingEl.innerText = `${remainingWords.length} words remaining`;
        console.log(remainingWords);
        if (remainingWords.length === 0) {
            errMsgEl.innerHTML = `ERROR: there are no remaining words to pick from. ` +
                `Are all of the statuses correct? Please refresh to try again.`;
            return;
        }
        if (remainingWords.length === 1) {
            console.log(`Only one word left: "${remainingWords[0]}"`);
            solveWordle(remainingWords[0]);
            return;
        }
        console.log(`${remainingWords.length} remaining words`);

        try {
            currentGuess = getNextGuess(remainingWords);
        } catch (e) {
            errMsgEl.innerHTML = e.message;
            return;
        }

        createGuessRow(currentGuess);
        cursorLastRow();

        console.log(`---`);
    }
    console.log('Done.');
    // It should be impossible to get here. However, not clear that it's an error?
    errMsgEl.innerHTML = 'The bot is very confused.';
}
main();
