use crate::{
    board::{PieceAtCoord, Pieces, FAKE_PIECE_AT_COORD},
    tetromino::{Tetromino, NUM_TETROMINOS},
};

#[derive(Clone, Copy, Debug, Eq, Hash, PartialEq)]
pub struct BoardHash {
    pieces: Pieces,
}

pub type SerializedHash = u64;

// There are 19 tetrominoes and 25 coordinates making 475 possibilities,
// meaning that the result will be in the lowest 9 bits.
const WORD_SIZE: usize = 9;

// 9 1's, all in the lowest bits
const BIT_MASK: u64 = u64::MAX >> (64 - WORD_SIZE);

// Returns the number of bits to left-shift a WORD_SIZE value that's all the way
// at the right-hand side of a u64
fn shift_amt(word_index: usize) -> usize {
    64 - (word_index + 1) * WORD_SIZE
}

impl BoardHash {
    pub fn new(pieces: Pieces) -> BoardHash {
        BoardHash { pieces }
    }

    pub fn serialize(&self) -> SerializedHash {
        let mut result: u64 = 0;
        for (i, piece_at_coord) in self.pieces.into_iter().enumerate() {
            let serialized = BoardHash::piece_at_coord_to_num(piece_at_coord);
            BoardHash::place_num_at_word_index(&mut result, i, serialized);
        }
        result
    }

    #[allow(dead_code)] // Used for testing
    pub fn deserialize(buf: SerializedHash) -> BoardHash {
        let mut result = BoardHash {
            pieces: [FAKE_PIECE_AT_COORD; 6],
        };
        for (i, piece_at_coord) in result.pieces.iter_mut().enumerate() {
            let serialized = BoardHash::read_num_at_word_index(buf, i);
            *piece_at_coord = BoardHash::num_to_piece_at_coord(serialized);
        }
        result
    }

    fn piece_at_coord_to_num(piece_at_coord: PieceAtCoord) -> u16 {
        if piece_at_coord.coord == 255 {
            // Return the largest value that will fit in one of our "words"
            BIT_MASK as u16
        } else {
            (piece_at_coord.coord as u16) * (NUM_TETROMINOS as u16)
                + (piece_at_coord.piece as u16)
        }
    }

    #[allow(dead_code)] // Used for testing
    fn num_to_piece_at_coord(num: u16) -> PieceAtCoord {
        if num == (BIT_MASK as u16) {
            FAKE_PIECE_AT_COORD
        } else {
            let num_tetronimos = NUM_TETROMINOS as u16;
            let coord = (num / num_tetronimos) as u8;
            let piece = Tetromino::from((num % num_tetronimos) as u8);
            PieceAtCoord { coord, piece }
        }
    }

    fn place_num_at_word_index(buf: &mut u64, word_index: usize, value: u16) {
        let shift_amount = shift_amt(word_index);
        // Assume that value is really a 9-bit integer from pieceAtCoordToNum
        let shifted_value = (value as u64) << shift_amount;
        let shifted_mask = BIT_MASK << shift_amount;

        // shifted_value should only have bits set underneath the mask: assert
        // that this is true for safety.
        assert_eq!(shifted_value, shifted_value & shifted_mask);

        // Clear relevant bits in buf
        *buf &= !shifted_mask;
        // Set new bits in buf
        *buf |= shifted_value;
    }

    #[allow(dead_code)] // Used for testing
    fn read_num_at_word_index(buf: u64, word_index: usize) -> u16 {
        let shift_amount = shift_amt(word_index);
        let shifted_mask = BIT_MASK << shift_amount;
        let extracted_bits = (buf & shifted_mask) >> shift_amount;

        // Assert that extracted_bits is going to fit in a u16, i.e. that all of
        // the bits except the first 9 are 0.
        assert_eq!(0, extracted_bits & !BIT_MASK);
        extracted_bits as u16
    }
}

#[cfg(test)]
mod tests {
    use crate::{board::Board, coord::BoardCoord};

    use super::*;

    #[test]
    fn test_deserialize_1() {
        let mut board = Board::new_empty();
        board = board
            .place_piece(Tetromino::I_2, BoardCoord { row: 0, col: 0 })
            .place_piece(Tetromino::I_2, BoardCoord { row: 0, col: 1 })
            .place_piece(Tetromino::I_2, BoardCoord { row: 0, col: 2 })
            .place_piece(Tetromino::I_2, BoardCoord { row: 0, col: 3 })
            .place_piece(Tetromino::I_2, BoardCoord { row: 0, col: 4 });

        assert_eq!(5, board.get_num_pieces());

        let hash = board.to_hash();
        let serialized_hash = hash.serialize();
        let new_hash = BoardHash::deserialize(serialized_hash);
        assert_eq!(hash, new_hash);
    }

    #[test]
    fn test_deserialize_2() {
        let mut board = Board::new_empty();
        board = board
            .place_piece(Tetromino::I_1, BoardCoord { row: 0, col: 0 })
            .place_piece(Tetromino::J_1, BoardCoord { row: 0, col: 3 })
            .place_piece(Tetromino::S_1, BoardCoord { row: 1, col: 1 })
            .place_piece(Tetromino::T_2, BoardCoord { row: 2, col: 0 })
            .place_piece(Tetromino::S_1, BoardCoord { row: 3, col: 1 });

        assert_eq!(5, board.get_num_pieces());

        let hash = board.to_hash();
        let serialized_hash = hash.serialize();
        let new_hash = BoardHash::deserialize(serialized_hash);
        assert_eq!(hash, new_hash);
    }
}
