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
const everythingGroup =
    document.createElementNS('http://www.w3.org/2000/svg', 'g');
everythingGroup.id = 'everything';

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
everythingGroup.appendChild(board);

const shape =
    document.createElementNS('http://www.w3.org/2000/svg', 'path');
shape.classList.add('shape');
// This is for a T_2 shape (per tetrominoes.ts)
// T
// TT
// T
// const commands = [
//     // Start right of top-left corner curve
//     `M ${BORDER_RADIUS} 0`,
//     // Top-left corner curve
//     corner(LEFT, DOWN),
//     // Down the left side
//     line(DOWN, mediumSide + fullSide + mediumSide),
//     // Bottom-most edge and both corners
//     corner(DOWN, RIGHT),
//     line(RIGHT, smallSide),
//     corner(RIGHT, UP),
//     // Coming back up one cell
//     line(UP, mediumSide),
//     // Sticky-outy cell on right
//     line(RIGHT, mediumSide),
//     corner(RIGHT, UP),
//     line(UP, smallSide),
//     corner(UP, LEFT),
//     line(LEFT, mediumSide),
//     // Finish going back up to the top, and close the curve
//     line(UP, mediumSide),
//     corner(UP, LEFT),
//     `z`,
// ];
// shape.setAttribute('d', commands.join(' '));
debugger;
shape.setAttribute('d', computeOutlinePath(T_2.getLetterGrid()));
shape.setAttribute('stroke', 'black');
shape.setAttribute('fill', 'blue');
shape.setAttribute('fill-opacity', '0.7');
shape.setAttribute('transform', 'translate(-21, 1)');
everythingGroup.appendChild(shape);

svgEl.appendChild(everythingGroup);
document.body.appendChild(svgEl);

let tetrominoIndex = 0;
document.body.addEventListener('click', () => {
    const nextTetromino = TETROMINOES[tetrominoIndex];
    console.log(nextTetromino.toString());
    shape.setAttribute('d', computeOutlinePath(nextTetromino.getLetterGrid()));
    tetrominoIndex = (tetrominoIndex + 1) % TETROMINOES.length;
});
