mod board;
mod board_hash;
mod consts;
mod coord;
mod tetromino;

use std::collections::HashSet;

use board::Board;
use board_hash::BoardHash;

fn main() {
    let mut visited_boards: HashSet<BoardHash> = HashSet::new();

    fn visit_children(board: Board, visited_boards: &mut HashSet<BoardHash>) {
        visited_boards.insert(board.to_hash());
        let mut could_add_any_pieces = false;
        for child in board.iter_children() {
            could_add_any_pieces = true;
            let child_hash = child.to_hash();
            if !visited_boards.contains(&child_hash) {
                visit_children(child, visited_boards);
            }
        }
        if !could_add_any_pieces {
            println!("{}", board.to_hash().serialize());
        }
    }

    visit_children(Board::new_empty(), &mut visited_boards);
    println!("Done");
}
