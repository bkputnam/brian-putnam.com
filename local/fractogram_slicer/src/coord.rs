use core::fmt;
use std::sync::OnceLock;

use crate::consts::WORD_SIZE;

#[derive(Clone, Copy, Debug, Eq, Hash, PartialEq)]
pub struct BoardCoord {
    pub row: u8,
    pub col: u8,
}

impl BoardCoord {
    pub fn to_index(&self) -> u8 {
        self.row * (WORD_SIZE as u8) + self.col
    }

    pub fn from_index(index: u8) -> Self {
        BoardCoord {
            row: index / (WORD_SIZE as u8),
            col: index % (WORD_SIZE as u8),
        }
    }
}

impl fmt::Display for BoardCoord {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "({}, {})", self.row, self.col)
    }
}

pub fn all_coords() -> &'static [BoardCoord; WORD_SIZE * WORD_SIZE] {
    static ALL_COORDS: OnceLock<[BoardCoord; WORD_SIZE * WORD_SIZE]> =
        OnceLock::new();
    ALL_COORDS.get_or_init(|| {
        core::array::from_fn(|i| {
            let row: u8 = (i / WORD_SIZE).try_into().unwrap();
            let col: u8 = (i % WORD_SIZE).try_into().unwrap();
            BoardCoord { row, col }
        })
    })
}
