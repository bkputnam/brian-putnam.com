import { BORDER_RADIUS, BORDER_WIDTH, CELL_WIDTH_PX } from "../consts.js";

// const abridgedSide = CELL_WIDTH_PX - BORDER_RADIUS;
const fullSide = CELL_WIDTH_PX + BORDER_WIDTH;
const mediumSide = CELL_WIDTH_PX - BORDER_RADIUS + BORDER_WIDTH;
const smallSide = CELL_WIDTH_PX - BORDER_RADIUS * 2 + BORDER_WIDTH;

enum Direction {
    UP = 'up',
    DOWN = 'down',
    LEFT = 'left',
    RIGHT = 'right',
}
const UP = Direction.UP;
const DOWN = Direction.DOWN;
const LEFT = Direction.LEFT;
const RIGHT = Direction.RIGHT;

function counterClockwise(dir: Direction): Direction {
    switch (dir) {
        case DOWN:
            return LEFT;
        case RIGHT:
            return DOWN;
        case UP:
            return RIGHT;
        case LEFT:
            return UP;
    }
}

function clockwise(dir: Direction): Direction {
    switch (dir) {
        case DOWN:
            return RIGHT;
        case RIGHT:
            return UP;
        case UP:
            return LEFT;
        case LEFT:
            return DOWN;
    }
}

function isUpOrDown(dir: Direction): boolean {
    return dir === Direction.UP || dir === Direction.DOWN;
}

function corner(dir1: Direction, dir2: Direction): string {
    if (isUpOrDown(dir1) === isUpOrDown(dir2)) {
        throw new Error(`Invalid directions: ${dir1} ${dir2}`);
    }
    const leftRightAmount = (dir: Direction): number =>
        dir === Direction.LEFT ? -BORDER_RADIUS :
            dir === Direction.RIGHT ? BORDER_RADIUS :
                0;
    const upDownAmount = (dir: Direction): number =>
        dir === Direction.UP ? -BORDER_RADIUS :
            dir === Direction.DOWN ? BORDER_RADIUS :
                0;
    const dx1 = leftRightAmount(dir1);
    const dy1 = upDownAmount(dir1);
    const dx = dx1 + leftRightAmount(dir2);
    const dy = dy1 + upDownAmount(dir2);
    // https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/d#quadratic_b%C3%A9zier_curve
    return `q ${dx1} ${dy1} ${dx} ${dy}`;
}

function line(dir: Direction, dist: number): string {
    // https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/d#lineto_path_commands
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

/**
 * Computes an SVG path around the non-null cells of letterGrid.
 * 
 * Starts in the top-left corner of the first non-null cell in the top row, and
 * then traces its way counter-clockwise around the shape.
 */
export function computeOutlinePath(letterGrid: Array<Array<string | null>>):
    string {
    const width = letterGrid[0].length;
    const height = letterGrid.length;

    const startingRow = 0;
    const startingCol = letterGrid[0]
        .findIndex((letter: string | null) => letter != null);
    const startingDir = DOWN;

    let row = startingRow;
    let col = startingCol;
    let dir = startingDir;
    const commands: string[] = [
        `M ${BORDER_RADIUS} 0`,
        corner(LEFT, DOWN),
    ];

    const exists = (dir1: Direction, dir2: Direction | 'same'): boolean => {
        const leftRightAmount = (dir: Direction | 'same'): number =>
            dir === Direction.LEFT ? -1 :
                dir === Direction.RIGHT ? 1 :
                    0;
        const upDownAmount = (dir: Direction | 'same'): number =>
            dir === Direction.UP ? -1 :
                dir === Direction.DOWN ? 1 :
                    0;
        const newRow = row + upDownAmount(dir1) + upDownAmount(dir2);
        const newCol = col + leftRightAmount(dir1) + leftRightAmount(dir2);
        if (newRow < 0 || newRow >= height || newCol < 0 || newCol >= width) {
            return false;
        }
        const result = letterGrid[newRow][newCol] !== null;
        if (result) {
            row = newRow;
            col = newCol;
        }
        return result;
    };
    const pushCommands = (...newCommands: string[]): void => {
        for (const com of newCommands) {
            commands.push(com);
        }
    };

    do {
        if (exists(dir, counterClockwise(dir))) {
            pushCommands(
                line(dir, smallSide),
                corner(dir, counterClockwise(dir)));
            dir = counterClockwise(dir);
        } else if (exists(dir, 'same')) {
            pushCommands(line(dir, fullSide));
        } else {
            pushCommands(
                line(dir, smallSide),
                corner(dir, clockwise(dir)));
            dir = clockwise(dir);
        }
    } while (!(row == startingRow && col == startingCol && dir == startingDir));

    return commands.join(' ');
}