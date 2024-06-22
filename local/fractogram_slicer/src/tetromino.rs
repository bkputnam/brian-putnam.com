use std::fmt;

use crate::coord::BoardCoord;

fn to_coords(coords: [[u8; 2]; 4]) -> [BoardCoord; 4] {
    coords.map(|coord| BoardCoord {
        row: coord[0],
        col: coord[1],
    })
}

#[allow(non_camel_case_types)]
#[derive(Clone, Copy, Debug, Eq, Hash, PartialEq)]
pub enum Tetromino {
    //  J
    //  J
    // JJ
    J_1 = 0,

    // JJJ
    //   J
    J_2,

    // JJ
    // J
    // J
    J_3,

    // J
    // JJJ
    J_4,

    //  SS
    // SS
    S_1,

    // S
    // SS
    //  S
    S_2,

    // TTT
    //  T
    T_1,

    // T
    // TT
    // T
    T_2,

    //  T
    // TTT
    T_3,

    //  T
    // TT
    //  T
    T_4,

    // IIII
    I_1,

    // I
    // I
    // I
    // I
    I_2,

    // OO
    // OO
    O_1,

    // LL
    //  L
    //  L
    L_1,

    //   L
    // LLL
    L_2,

    // L
    // L
    // LL
    L_3,

    // LLL
    // L
    L_4,

    // ZZ
    //  ZZ
    Z_1,

    //  Z
    // ZZ
    // Z
    Z_2,
}

pub const ALL_TETROMINOS: [Tetromino; 19] = [
    Tetromino::J_1,
    Tetromino::J_2,
    Tetromino::J_3,
    Tetromino::J_4,
    Tetromino::S_1,
    Tetromino::S_2,
    Tetromino::T_1,
    Tetromino::T_2,
    Tetromino::T_3,
    Tetromino::T_4,
    Tetromino::I_1,
    Tetromino::I_2,
    Tetromino::O_1,
    Tetromino::L_1,
    Tetromino::L_2,
    Tetromino::L_3,
    Tetromino::L_4,
    Tetromino::Z_1,
    Tetromino::Z_2,
];

pub const NUM_TETROMINOS: usize = ALL_TETROMINOS.len();

impl Tetromino {
    pub fn filled_coords(&self) -> [BoardCoord; 4] {
        match self {
            Tetromino::J_1 => to_coords([[0, 1], [1, 1], [2, 0], [2, 1]]),
            Tetromino::J_2 => to_coords([[0, 0], [0, 1], [0, 2], [1, 2]]),
            Tetromino::J_3 => to_coords([[0, 0], [0, 1], [1, 0], [2, 0]]),
            Tetromino::J_4 => to_coords([[0, 0], [1, 0], [1, 1], [1, 2]]),

            Tetromino::S_1 => to_coords([[0, 1], [0, 2], [1, 0], [1, 1]]),
            Tetromino::S_2 => to_coords([[0, 0], [1, 0], [1, 1], [2, 1]]),

            Tetromino::T_1 => to_coords([[0, 0], [0, 1], [0, 2], [1, 1]]),
            Tetromino::T_2 => to_coords([[0, 0], [1, 0], [1, 1], [2, 0]]),
            Tetromino::T_3 => to_coords([[0, 1], [1, 0], [1, 1], [1, 2]]),
            Tetromino::T_4 => to_coords([[0, 1], [1, 0], [1, 1], [2, 1]]),

            Tetromino::I_1 => to_coords([[0, 0], [0, 1], [0, 2], [0, 3]]),
            Tetromino::I_2 => to_coords([[0, 0], [1, 0], [2, 0], [3, 0]]),

            Tetromino::O_1 => to_coords([[0, 0], [0, 1], [1, 0], [1, 1]]),

            Tetromino::L_1 => to_coords([[0, 0], [0, 1], [1, 1], [2, 1]]),
            Tetromino::L_2 => to_coords([[0, 2], [1, 0], [1, 1], [1, 2]]),
            Tetromino::L_3 => to_coords([[0, 0], [1, 0], [2, 0], [2, 1]]),
            Tetromino::L_4 => to_coords([[0, 0], [0, 1], [0, 2], [1, 0]]),

            Tetromino::Z_1 => to_coords([[0, 0], [0, 1], [1, 1], [1, 2]]),
            Tetromino::Z_2 => to_coords([[0, 1], [1, 0], [1, 1], [2, 0]]),
        }
    }
}

impl fmt::Display for Tetromino {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            Tetromino::J_1 => write!(f, "J_1"),
            Tetromino::J_2 => write!(f, "J_2"),
            Tetromino::J_3 => write!(f, "J_3"),
            Tetromino::J_4 => write!(f, "J_4"),

            Tetromino::S_1 => write!(f, "S_1"),
            Tetromino::S_2 => write!(f, "S_2"),

            Tetromino::T_1 => write!(f, "T_1"),
            Tetromino::T_2 => write!(f, "T_2"),
            Tetromino::T_3 => write!(f, "T_3"),
            Tetromino::T_4 => write!(f, "T_4"),

            Tetromino::I_1 => write!(f, "I_1"),
            Tetromino::I_2 => write!(f, "I_2"),

            Tetromino::O_1 => write!(f, "O_1"),

            Tetromino::L_1 => write!(f, "L_1"),
            Tetromino::L_2 => write!(f, "L_2"),
            Tetromino::L_3 => write!(f, "L_3"),
            Tetromino::L_4 => write!(f, "L_4"),

            Tetromino::Z_1 => write!(f, "Z_1"),
            Tetromino::Z_2 => write!(f, "Z_2"),
        }
    }
}

impl From<u8> for Tetromino {
    fn from(i: u8) -> Self {
        match i {
            x if x == Tetromino::J_1 as u8 => Tetromino::J_1,
            x if x == Tetromino::J_2 as u8 => Tetromino::J_2,
            x if x == Tetromino::J_3 as u8 => Tetromino::J_3,
            x if x == Tetromino::J_4 as u8 => Tetromino::J_4,

            x if x == Tetromino::S_1 as u8 => Tetromino::S_1,
            x if x == Tetromino::S_2 as u8 => Tetromino::S_2,

            x if x == Tetromino::T_1 as u8 => Tetromino::T_1,
            x if x == Tetromino::T_2 as u8 => Tetromino::T_2,
            x if x == Tetromino::T_3 as u8 => Tetromino::T_3,
            x if x == Tetromino::T_4 as u8 => Tetromino::T_4,

            x if x == Tetromino::I_1 as u8 => Tetromino::I_1,
            x if x == Tetromino::I_2 as u8 => Tetromino::I_2,

            x if x == Tetromino::O_1 as u8 => Tetromino::O_1,

            x if x == Tetromino::L_1 as u8 => Tetromino::L_1,
            x if x == Tetromino::L_2 as u8 => Tetromino::L_2,
            x if x == Tetromino::L_3 as u8 => Tetromino::L_3,
            x if x == Tetromino::L_4 as u8 => Tetromino::L_4,

            x if x == Tetromino::Z_1 as u8 => Tetromino::Z_1,
            x if x == Tetromino::Z_2 as u8 => Tetromino::Z_2,

            _ => panic!("Invalid call Tetromino::from({:?})", i),
        }
    }
}
