import { CELL_WIDTH_PX } from "../consts.js";

export function createLetterEl(row: number, col: number, letter: string):
    SVGTextElement {
    const text = document.createElementNS(
        'http://www.w3.org/2000/svg', 'text');
    text.classList.add('letter');
    text.textContent = letter;

    const shiftX = CELL_WIDTH_PX / 2;
    const shiftY = CELL_WIDTH_PX / 2;
    text.setAttribute('x', col * (CELL_WIDTH_PX + 1) + shiftX + '');
    text.setAttribute('y', row * (CELL_WIDTH_PX + 1) + shiftY + '');
    text.setAttribute('text-anchor', 'middle');
    text.setAttribute('dominant-baseline', 'mathematical');
    return text;
}
