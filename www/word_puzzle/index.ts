// Make sure that dragDropService initializes itself
import './bkp_drag_drop/drag_drop_service.js';

import { SOLUTIONS } from './data/solutions.js';
import { pick1 } from './util/random.js';
import { Solution } from './data_structures/solution.js';
import { PlayAreaController } from './render/play_area_controller.js';
import { CELL_WIDTH_PX } from './consts.js';
import { computeOutlinePath } from './svg/path_util.js';
import { TETROMINOES, T_2 } from './data/tetrominoes.js';

// const solutionText = pick1(SOLUTIONS);
// console.log(solutionText);
// const solution = new Solution(solutionText);

// const playAreaController = new PlayAreaController(solution);
// document.body.appendChild(playAreaController.render());

const svgEl = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
// Use nested <svg> to shift everything right by 50% of page width
// https://stackoverflow.com/questions/56364905/how-to-do-svg-transform-in-percentage#answer-56366560
const centeringSvg =
    document.createElementNS('http://www.w3.org/2000/svg', 'svg');
centeringSvg.id = 'centering-svg';
centeringSvg.setAttribute('x', '50%');

const board =
    document.createElementNS('http://www.w3.org/2000/svg', 'g');
board.id = 'board';

const maxOffset = 5 * (CELL_WIDTH_PX + 1);
for (let i = 0; i < 6; i++) {
    const offset = i * (CELL_WIDTH_PX + 1);

    const verticalLine =
        document.createElementNS('http://www.w3.org/2000/svg', 'line');
    verticalLine.setAttribute('x1', '' + offset);
    verticalLine.setAttribute('y1', '0');
    verticalLine.setAttribute('x2', '' + offset);
    verticalLine.setAttribute('y2', '' + maxOffset);
    verticalLine.setAttribute('stroke', 'black');

    const horizontalLine =
        document.createElementNS('http://www.w3.org/2000/svg', 'line');
    horizontalLine.setAttribute('x1', '0');
    horizontalLine.setAttribute('y1', '' + offset);
    horizontalLine.setAttribute('x2', '' + maxOffset);
    horizontalLine.setAttribute('y2', '' + offset);
    horizontalLine.setAttribute('stroke', 'black');

    board.appendChild(verticalLine);
    board.appendChild(horizontalLine);
}
centeringSvg.appendChild(board);

const shape =
    document.createElementNS('http://www.w3.org/2000/svg', 'path');
shape.classList.add('shape');
shape.setAttribute('d', computeOutlinePath(T_2.getLetterGrid()));
shape.setAttribute('stroke', 'black');
shape.setAttribute('fill', 'blue');
shape.setAttribute('fill-opacity', '0.7');
shape.setAttribute('transform', 'translate(-21, 1)');
centeringSvg.appendChild(shape);

svgEl.appendChild(centeringSvg);
document.body.appendChild(svgEl);

let tetrominoIndex = 0;
document.body.addEventListener('click', () => {
    const nextTetromino = TETROMINOES[tetrominoIndex];
    console.log(nextTetromino.toString());
    shape.setAttribute('d', computeOutlinePath(nextTetromino.getLetterGrid()));
    tetrominoIndex = (tetrominoIndex + 1) % TETROMINOES.length;
});
