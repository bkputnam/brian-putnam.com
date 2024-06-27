import { WORD_SIZE } from "../data/solutions.js";
import { O_1, TETROMINOES, TETROMINO_REVERSE_LOOKUP, tetrominoFromRustEnum } from "../data/tetrominoes.js";
import { BoardCoord } from "../data_structures/coord.js";
import { Piece, PieceAtCoord, PieceAtIndex } from "../data_structures/piece.js";

// This type just helps clarify what sort of a number we expect to be inside the
// BigInt (an unsigned int64). It doesn't provide any additional type safety.
export type u64 = bigint;

// This type just helps clarify what sort of a number we expect to be inside the
// BigInt (an unsigned int16). It doesn't provide any additional type safety.
export type u16 = number;

// See: WORD_SIZE in board_hash.rs. Note: renamed so as not to conflict with
// pre-existing WORD_SIZE constant in fractograms code.
const SERIALIZED_WORD_SIZE = 9;

// See: BIT_MASK in board_hash.rs
const BIT_MASK = BigInt(Math.pow(2, 9) - 1);

const FAKE_PIECE_AT_COORD: PieceAtIndex = {
    piece: O_1,
    coord: 255,
};

// See: shift_amt in board_hash.rs
function shiftAmt(wordIndex: number): u64 {
    return BigInt(64 - (wordIndex + 1) * SERIALIZED_WORD_SIZE);
}

// See: deserialize in board_hash.rs
export function deserialize(buf: u64): Array<PieceAtCoord> {
    const result: PieceAtCoord[] = [];
    for (let i = 0; i < 6; i++) {
        const serialized = readNumAtWordIndex(buf, i);
        const pieceAtIndex = numToPieceAtCoord(serialized);
        const pieceName = TETROMINO_REVERSE_LOOKUP.get(pieceAtIndex.piece);
        if (pieceAtIndex.coord === 255) {
            break;
        }
        const coord = coordFromIndex(pieceAtIndex.coord);
        result.push({ piece: pieceAtIndex.piece, coord });
    }
    return result;
}

// See BoardCoord::from_index in coord.rs
function coordFromIndex(index: number): BoardCoord {
    return {
        row: Math.floor(index / WORD_SIZE),
        col: index % WORD_SIZE,
    };
}

// See read_num_at_word_index in board_hash.rs
function readNumAtWordIndex(buf: u64, wordIndex: number): u16 {
    const shiftAmount = shiftAmt(wordIndex);
    const shiftedMask = BIT_MASK << shiftAmount;
    const extractedBits = (buf & shiftedMask) >> shiftAmount;

    const result = Number(extractedBits);
    if (BigInt(result) !== extractedBits) {
        throw new Error(
            `Error extracting bits: extractedBits was ${extractedBits} but ` +
            `became ${result} upon conversion to Number`);
    }
    return result;
}

// See num_to_piece_at_coord in board_hash.rs
function numToPieceAtCoord(num: u16): PieceAtIndex {
    if (num == Number(BIT_MASK)) {
        return FAKE_PIECE_AT_COORD;
    }
    const numTetrominoes = TETROMINOES.length;
    const coord = Math.floor(num / numTetrominoes);
    const piece = tetrominoFromRustEnum(num % numTetrominoes);
    return { piece, coord };
}