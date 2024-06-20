mod board;
mod consts;
mod coord;
mod tetromino;

use std::io::stdin;

use board::Board;
use coord::BoardCoord;
use tetromino::Tetromino;

const ALL_TETROMINOS: [Tetromino; 19] = [
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

fn main() {
    // let mut board = Board::new_empty();
    // board.place_piece(Tetromino::T_1, BoardCoord { row: 0, col: 0 });
    // board.place_piece(Tetromino::L_1, BoardCoord { row: 0, col: 3 });
    // println!("{}", board);

    for piece in ALL_TETROMINOS.into_iter() {
        let mut board = Board::new_empty();
        board.place_piece(piece, BoardCoord { row: 0, col: 0 });
        println!("{}", board);
        println!("{:?}", piece);

        let mut buf = String::new();
        stdin().read_line(&mut buf);
    }
}
