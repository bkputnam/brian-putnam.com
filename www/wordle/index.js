const guessesScrollContainer =
    document.getElementById('guesses-scroll-ctr');
const guesses =
    document.getElementById('guesses');
const inputCharNotUsed = document.getElementById('char-not-used');
const inputCharUsedElsewhere =
    document.getElementById('char-used-elsewhere');
const inputCharUsedHere =
    document.getElementById('char-used-here');

inputCharNotUsed.addEventListener('click', markNotUsed);
inputCharUsedElsewhere.addEventListener('click', markUsedElsewhere);
inputCharUsedHere.addEventListener('click', markUsedHere);
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

function createGuessRow() {
    const tr = document.createElement('tr');
    for (let i=0; i<5; i++) {
        tr.appendChild(
            document.createElement('td'));
    }
    guesses.appendChild(tr);
    return tr;
}

function nextSiblingElement(el) {
    if (!el.nextSibling || el.nextSibling.nodeType === 1) {
        return el.nextSibling;
    }
    return nextSiblingElement(el.nextSibling);
}

function advanceCursor() {
    const cursor = getCursoredElement();
    const nextSibling = nextSiblingElement(cursor);
    if (nextSibling) {
        setCursor(nextSibling);
        return;
    }
    const tr = createGuessRow();
    setCursor(tr.querySelector('td:first-child'));
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

function markNotUsed() {
    const cursor = getCursoredElement();
    cursor.classList.add('char-not-used');
    advanceCursor();
}

function markUsedElsewhere() {
    const cursor = getCursoredElement();
    cursor.classList.add('char-used-elsewhere');
    advanceCursor();
}

function markUsedHere() {
    const cursor = getCursoredElement();
    cursor.classList.add('char-used-here');
    advanceCursor();
}

