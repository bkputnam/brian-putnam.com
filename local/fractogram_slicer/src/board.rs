use std::fmt;

use crate::consts::WORD_SIZE;
use crate::coord::{all_coords, BoardCoord};
use crate::tetromino::{Tetromino, ALL_TETROMINOS};

#[derive(Clone, Copy, Debug, Eq, Hash, PartialEq)]
pub struct PieceAtCoord {
    piece: Tetromino,
    coord: u8,
}

pub type Pieces = [PieceAtCoord; 20];

#[derive(Debug, PartialEq, Clone)]
pub struct Board {
    pub is_filled: [[bool; WORD_SIZE]; WORD_SIZE],
    pieces: Pieces,
    num_pieces: usize,
}

#[derive(Clone, Copy, Debug, Eq, Hash, PartialEq)]
pub struct BoardHash {
    pieces: Pieces,
}

impl Board {
    pub fn new_empty() -> Self {
        {
            Board {
                is_filled: [[false; WORD_SIZE]; WORD_SIZE],
                pieces: [PieceAtCoord {
                    piece: Tetromino::O_1,
                    coord: 255,
                }; 20],
                num_pieces: 0,
            }
        }
    }

    fn place_piece_internal(&mut self, piece: Tetromino, coord: BoardCoord) {
        for piece_coord in piece.filled_coords() {
            let row = (piece_coord.row + coord.row) as usize;
            let col = (piece_coord.col + coord.col) as usize;
            self.is_filled[row][col] = true;
        }

        // Insert the piece in order by coord (as a single number).
        let coord_index = coord.to_index();
        let piece_at_coord = PieceAtCoord {
            piece,
            coord: coord_index,
        };
        if self.num_pieces == 0 {
            self.pieces[0] = piece_at_coord;
        } else {
            for piece_index in (0..self.num_pieces).rev() {
                if self.pieces[piece_index].coord > coord_index {
                    // This piece should come after the new piece, so move it
                    // backwards in the array to make room
                    self.pieces[piece_index + 1] = self.pieces[piece_index];
                } else if self.pieces[piece_index].coord == coord_index {
                    // This should be impossible.
                    panic!(
                        "Tried to insert two pieces at the same coordinates {}",
                        coord
                    );
                } else {
                    // This piece
                    self.pieces[piece_index + 1] = piece_at_coord;
                    break;
                }
            }
        }
        self.num_pieces += 1;
    }

    pub fn can_place_piece(&self, piece: Tetromino, coord: BoardCoord) -> bool {
        let piece_coords = piece.filled_coords().map(|piece_coord| {
            [
                (piece_coord.row + coord.row) as usize,
                (piece_coord.col + coord.col) as usize,
            ]
        });
        for [row, col] in piece_coords.into_iter() {
            if row >= 5 || col >= 5 {
                return false;
            }
            if self.is_filled[row][col] {
                return false;
            }
        }
        true
    }

    pub fn place_piece(&self, piece: Tetromino, coord: BoardCoord) -> Board {
        let mut result = self.clone();
        result.place_piece_internal(piece, coord);
        result
    }

    pub fn to_hash(&self) -> BoardHash {
        BoardHash {
            pieces: self.pieces.clone(),
        }
    }

    pub fn iter_children(&self) -> ChildIterator {
        ChildIterator::new(self)
    }
}

impl fmt::Display for Board {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        // let mut is_first = true;
        // let mut is_filled_str = String::new();
        // for row in self.is_filled {
        //     if is_first {
        //         is_first = false;
        //     } else {
        //         is_filled_str.push('\n');
        //     }
        //     let row_str = row
        //         .map(|val| match val {
        //             true => "X",
        //             false => "_",
        //         })
        //         .join("");
        //     is_filled_str.push_str(&row_str);
        // }

        let mut pieces_str = String::new();
        let mut is_first = true;
        for piece_index in 0..self.num_pieces {
            if is_first {
                is_first = false;
            } else {
                pieces_str.push_str(", ");
            }
            let PieceAtCoord { piece, coord } = self.pieces[piece_index];
            let foo: String = format!("{}: {}", piece.to_string(), BoardCoord::from_index(coord));
            pieces_str.push_str(&foo);
        }

        // write!(f, "{}\n{}", is_filled_str, pieces_str)
        write!(f, "{}", pieces_str)
    }
}

pub struct ChildIterator<'a> {
    board: &'a Board,

    cur_coord: BoardCoord,
    coord_iter: std::slice::Iter<'a, BoardCoord>,

    piece_iter: std::array::IntoIter<Tetromino, 19>,
}

impl<'a> ChildIterator<'a> {
    pub fn new(board: &'a Board) -> ChildIterator<'a> {
        let mut coord_iter = all_coords().into_iter();
        let cur_coord = coord_iter.next().unwrap();
        ChildIterator {
            board,
            cur_coord: *cur_coord,
            coord_iter,
            piece_iter: ALL_TETROMINOS.into_iter(),
        }
    }

    fn next_piece(&mut self) -> Option<Tetromino> {
        let piece = self.piece_iter.next();
        if piece.is_some() {
            return piece;
        }

        match self.coord_iter.next() {
            Option::None => {
                // We're out of new pieces and out of new coords, we're 100%
                // done iterating
                return Option::None;
            }
            Option::Some(next_coord) => {
                self.cur_coord = *next_coord;
                self.piece_iter = ALL_TETROMINOS.into_iter();
                // This is guaranteed to be Some(...) not None
                self.piece_iter.next()
            }
        }
    }
}

impl<'a> Iterator for ChildIterator<'a> {
    type Item = Board;

    fn next(&mut self) -> Option<Self::Item> {
        let maybe_piece = self.next_piece();
        if maybe_piece.is_none() {
            return Option::None;
        }
        let piece = maybe_piece.unwrap();

        if self.board.can_place_piece(piece, self.cur_coord) {
            Option::Some(self.board.place_piece(piece, self.cur_coord))
        } else {
            self.next()
        }
    }
}
