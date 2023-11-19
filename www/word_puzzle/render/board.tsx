import React, { ReactElement } from 'react';

import { Board } from "../data_structures/board.js";

export function renderBoard(board: Board): ReactElement {
    return (<div className="board">
        Board
    </div>);
}
