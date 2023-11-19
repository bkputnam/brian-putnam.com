import { Piece } from "../data_structures/piece.js";

export const J_1 = Piece.fromString('_J\n_\J\nJJ');
export const J_2 = Piece.fromString('JJJ\n__J');
export const J_3 = Piece.fromString('JJ\nJ_\nJ_');
export const J_4 = Piece.fromString('J__\nJJJ');

export const S_1 = Piece.fromString('_SS\nSS_');
export const S_2 = Piece.fromString('S_\nSS\n_S');

export const T_1 = Piece.fromString('TTT\n_T_');
export const T_2 = Piece.fromString('T_\nTT\nT_');
export const T_3 = Piece.fromString('_T_\nTTT');
export const T_4 = Piece.fromString('_T\nTT\n_T');

export const I_1 = Piece.fromString('IIII');
export const I_2 = Piece.fromString('I\nI\nI\nI');

export const O_1 = Piece.fromString('OO\nOO');

export const L_1 = Piece.fromString('LL\n_L\n_L');
export const L_2 = Piece.fromString('__L\nLLL');
export const L_3 = Piece.fromString('L_\nL_\nLL');
export const L_4 = Piece.fromString('LLL\nL__');

export const Z_1 = Piece.fromString('ZZ_\n_ZZ');
export const Z_2 = Piece.fromString('_Z\nZZ\nZ_');

export const TETROMINOES: readonly Piece[] = [
    J_1, J_2, J_3, J_4,
    S_1, S_2,
    T_1, T_2, T_3, T_4,
    I_1, I_2,
    O_1,
    L_1, L_2, L_3, L_4,
    Z_1, Z_2,
];
