use crate::board::Pieces;

#[derive(Eq, Hash, PartialEq)]
pub struct CompactBoard {
    pieces: Pieces,
    num_pieces: usize,
}

impl CompactBoard {
    pub fn new(pieces: Pieces, num_pieces: usize) -> CompactBoard {
        CompactBoard { pieces, num_pieces }
    }
}
