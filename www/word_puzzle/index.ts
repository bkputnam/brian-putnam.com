// Make sure that dragDropService initializes itself
import './bkp_drag_drop/drag_drop_service.js';

import { SOLUTIONS } from './data/solutions.js';
import { pick1 } from './util/random.js';
import { Solution } from './data_structures/solution.js';
import { PlayAreaController } from './render/play_area_controller.js';
import { CELL_WIDTH_PX } from './consts.js';

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

enum Direction {
    UP, DOWN, LEFT, RIGHT
}
const UP = Direction.UP;
const DOWN = Direction.DOWN;
const LEFT = Direction.LEFT;
const RIGHT = Direction.RIGHT;

function isUpOrDown(dir: Direction): boolean {
    return dir === Direction.UP || dir === Direction.DOWN;
}

function corner(dir1: Direction, dir2: Direction): string {
    if (isUpOrDown(dir1) === isUpOrDown(dir2)) {
        throw new Error(`Invalid directions: ${dir1} ${dir2}`);
    }
    const dx1 =
        dir1 === Direction.LEFT ? -BORDER_RADIUS :
            dir1 === Direction.RIGHT ? BORDER_RADIUS :
                0;
    const dy1 =
        dir1 === Direction.UP ? -BORDER_RADIUS :
            dir1 === Direction.DOWN ? BORDER_RADIUS :
                0;
    const dx = dx1 + (
        dir2 === Direction.LEFT ? -BORDER_RADIUS :
            dir2 === Direction.RIGHT ? BORDER_RADIUS :
                0);
    const dy = dy1 + (
        dir2 === Direction.UP ? -BORDER_RADIUS :
            dir2 === Direction.DOWN ? BORDER_RADIUS :
                0);
    return `q ${dx1} ${dy1} ${dx} ${dy}`;
}

function line(dir: Direction, dist: number): string {
    switch (dir) {
        case Direction.UP:
            return `v -${dist}`;
        case Direction.DOWN:
            return `v ${dist}`;
        case Direction.LEFT:
            return `h -${dist}`;
        case Direction.RIGHT:
            return `h ${dist}`;
    }
}

const BORDER_RADIUS = 13;
const BORDER_WIDTH = 1;
// const abridgedSide = CELL_WIDTH_PX - BORDER_RADIUS;
const fullSide = CELL_WIDTH_PX + BORDER_WIDTH;
const mediumSide = CELL_WIDTH_PX - BORDER_RADIUS + BORDER_WIDTH;
const smallSide = CELL_WIDTH_PX - BORDER_RADIUS * 2 + BORDER_WIDTH;
const shape =
    document.createElementNS('http://www.w3.org/2000/svg', 'path');
shape.classList.add('shape');
// This is for a T_2 shape (per tetrominoes.ts)
const commands = [
    // Start right of top-left corner curve
    `M ${BORDER_RADIUS} 0`,
    // Top-left corner curve
    corner(LEFT, DOWN),
    // Down the left side
    line(DOWN, mediumSide + fullSide + mediumSide),
    // Bottom-most edge and both corners
    corner(DOWN, RIGHT),
    line(RIGHT, smallSide),
    corner(RIGHT, UP),
    // Coming back up one cell
    line(UP, mediumSide),
    // Sticky-outy cell on right
    line(RIGHT, mediumSide),
    corner(RIGHT, UP),
    line(UP, smallSide),
    corner(UP, LEFT),
    line(LEFT, mediumSide),
    // Finish going back up to the top, and close the curve
    line(UP, mediumSide),
    corner(UP, LEFT),
    `z`,
];
shape.setAttribute('d', commands.join(' '));
shape.setAttribute('stroke', 'black');
shape.setAttribute('fill', 'blue');
shape.setAttribute('fill-opacity', '0.5');
shape.setAttribute('transform', 'translate(-21, 1)');
everythingGroup.appendChild(shape);

svgEl.appendChild(everythingGroup);
document.body.appendChild(svgEl);
