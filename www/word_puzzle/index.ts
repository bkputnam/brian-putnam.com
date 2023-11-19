import { Board } from "./data_structures/board.js";
import { SOLUTIONS } from "./data/solutions.js";
import { pick1 } from "./util/random.js";
import { renderBoard } from './render/board.js';
// import ReactDom from 'react-dom';
import { Solution } from "./data_structures/solution.js";

const solutionText = pick1(SOLUTIONS);
const solution = new Solution(solutionText);
for (const thing of solution.toRandomPieces()) {
    console.log(thing.piece.toString());
}

// ReactDom.render(
//     renderBoard(new Board(/* size= */ 10)),
//     document.getElementById('board-container')
// );
