import { Board } from "./board.js";
import { Piece } from "./piece.js";
import { Solution } from "./solution.js";
import { I_1, T_1 } from "./tetrominoes.js";

// const piece = Piece.fromString('_t_\nttt\n_t_');
// console.log(piece.toString());

// const piece2 = Piece.fromString('L_\nL_\nLL');
// console.log(piece2.toString());

// const board = new Board(/* size= */ 5);
// const success1 = board.tryPlacePiece(I_1, { row: 0, col: 1 });
// console.log(`success1: ${success1}`);
// console.log(`board:\n${board.toString()}`);

const solution = new Solution([
    'SPRAT',
    'WAIVE',
    'ANVIL',
    'IDEAL',
    'NANNY',
].join('\n'));

for (const thing of solution.toRandomPieces()) {
    console.log(thing.piece.toString());
}


