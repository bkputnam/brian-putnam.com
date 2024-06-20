use std::fmt;

use crate::consts::WORD_SIZE;
use crate::coord::BoardCoord;
use crate::tetromino::Tetromino;

#[derive(Debug, PartialEq, Clone, Copy)]
pub struct PieceAtCoord {
    piece: Tetromino,
    coord: BoardCoord,
}

#[derive(Debug, PartialEq, Clone)]
pub struct Board {
    pub is_filled: [[bool; WORD_SIZE]; WORD_SIZE],
    pieces: [PieceAtCoord; 20],
    num_pieces: usize,
}

impl Board {
    pub fn new_empty() -> Self {
        {
            Board {
                is_filled: [[false; WORD_SIZE]; WORD_SIZE],
                pieces: [PieceAtCoord {
                    piece: Tetromino::O_1,
                    coord: BoardCoord { row: 100, col: 100 },
                }; 20],
                num_pieces: 0,
            }
        }
    }

    pub fn place_piece(&mut self, piece: Tetromino, coord: BoardCoord) -> bool {
        let piece_coords = piece.filled_coords().map(|piece_coord| {
            [
                (piece_coord.row + coord.row) as usize,
                (piece_coord.col + coord.col) as usize,
            ]
        });
        for [row, col] in piece_coords.into_iter() {
            if self.is_filled[row][col] {
                return false;
            }
        }
        for [row, col] in piece_coords.into_iter() {
            self.is_filled[row][col] = true;
        }

        self.pieces[self.num_pieces] = PieceAtCoord { piece, coord };
        self.num_pieces += 1;
        true
    }
}

impl fmt::Display for Board {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        let mut is_first = true;
        let mut is_filled_str = String::new();
        for row in self.is_filled {
            if is_first {
                is_first = false;
            } else {
                is_filled_str.push('\n');
            }
            let row_str = row
                .map(|val| match val {
                    true => "X",
                    false => "_",
                })
                .join("");
            is_filled_str.push_str(&row_str);
        }

        let mut pieces_str = String::new();
        is_first = true;
        for piece_index in 0..self.num_pieces {
            if is_first {
                is_first = false;
            } else {
                pieces_str.push_str(", ");
            }
            let PieceAtCoord { piece, coord } = self.pieces[piece_index];
            let foo: String = format!("{}: ({}, {})", piece.to_string(), coord.row, coord.col);
            pieces_str.push_str(&foo);
        }

        write!(f, "{}\n{}", is_filled_str, pieces_str)
    }
}

// #[cfg(test)]
// mod tests {
//     use super::*;

//     #[test]
//     fn test_rotate_90_cw() {
//         #[rustfmt::skip]
//         let mut board = Board::from_ints([
//                     [ 1,  2,  3,  4,  5],
//                     [ 6,  7,  8,  9, 10],
//                     [11, 12, 13, 14, 15],
//                     [16, 17, 18, 19, 20],
//                     [21, 22, 23, 24, 25],
//                 ]);
//         #[rustfmt::skip]
//         let expected = Board::from_ints([
//                     [21, 16, 11,  6,  1],
//                     [22, 17, 12,  7,  2],
//                     [23, 18, 13,  8,  3],
//                     [24, 19, 14,  9,  4],
//                     [25, 20, 15, 10,  5],
//                 ]);

//         board.rotate_90_cw();
//         assert_eq!(expected, board);
//     }
// }
