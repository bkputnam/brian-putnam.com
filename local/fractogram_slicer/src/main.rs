mod board;
mod board_hash;
mod consts;
mod coord;
mod hash_writer;
mod tetromino;

use std::{
    collections::HashSet,
    ffi::OsStr,
    fs::{read_dir, remove_file},
    path::Path,
};

use board::Board;
use board_hash::BoardHash;
use hash_writer::HashWriter;

const DEST: &str = "../../www/fractograms/data/slices";

fn delete_preexisting_slices() {
    let dest = Path::new(DEST);
    let dir_iter = match read_dir(dest) {
        Err(reason) => panic!("Failed to read dest: {}", reason),
        Ok(dir_iter) => dir_iter,
    };
    for result in dir_iter {
        let dir_entry = match result {
            Err(reason) => {
                panic!("Failed to read dir_entry in dest: {}", reason)
            }
            Ok(dir_entry) => dir_entry,
        };
        let path = dir_entry.path();
        match path.extension() {
            None => { /* don't delete files without extensions */ }
            Some(ext) => {
                if ext == OsStr::new("slice") {
                    match remove_file(path) {
                        Err(reason) => panic!(
                            "Failed to delete file {:?}: {}",
                            dir_entry.file_name(),
                            reason
                        ),
                        Ok(_) => {}
                    };
                }
            }
        }
    }
}

fn main() {
    let mut visited_boards: HashSet<BoardHash> = HashSet::new();

    fn visit_children(
        board: Board,
        visited_boards: &mut HashSet<BoardHash>,
        hash_writer: &mut HashWriter,
    ) {
        visited_boards.insert(board.to_hash());
        let mut could_add_any_pieces = false;
        for child in board.iter_children() {
            could_add_any_pieces = true;
            let child_hash = child.to_hash();
            if !visited_boards.contains(&child_hash) {
                visit_children(child, visited_boards, hash_writer);
            }
        }
        if !could_add_any_pieces {
            // println!("{}", board.to_hash().serialize());
            hash_writer.write_hash(board.to_hash());
        }
    }

    delete_preexisting_slices();
    let mut hash_writer = HashWriter::new(&DEST);
    visit_children(Board::new_empty(), &mut visited_boards, &mut hash_writer);
    hash_writer.flush();
    println!(
        "Done. {} hashes written",
        hash_writer.get_num_hashes_written()
    );
}
