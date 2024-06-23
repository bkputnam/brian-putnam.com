mod board;
mod board_hash;
mod consts;
mod coord;
mod tetromino;

use std::{
    collections::HashSet, fs::File, io::Write, mem::size_of, path::Path,
};

use board::Board;
use board_hash::{BoardHash, SerializedHash};

// Aim for 3kb per .slice file (arbitrary size)
const MAX_HASHES_PER_FILE: usize = (1024 * 3) / size_of::<SerializedHash>();

struct HashWriter {
    current_file_index: usize,
    write_buffer:
        [u8; MAX_HASHES_PER_FILE * size_of::<u64>() / size_of::<u8>()],
    next_byte_index: usize,
}

impl HashWriter {
    pub fn new() -> HashWriter {
        HashWriter {
            current_file_index: 0,
            write_buffer: [0; MAX_HASHES_PER_FILE * size_of::<u64>()
                / size_of::<u8>()],
            next_byte_index: 0,
        }
    }

    pub fn flush(&mut self) {
        let file_name = format!("{:04}.slice", self.current_file_index);
        let file_path = Path::new(&file_name);
        self.current_file_index += 1;
        let mut file = match File::create(&file_name) {
            Err(reason) => {
                panic!("couldn't open {}: {}", file_path.display(), reason);
            }
            Ok(file) => file,
        };
        match file.write_all(&self.write_buffer[0..self.next_byte_index]) {
            Err(reason) => {
                panic!("Failed to write to {}: {}", file_name, reason)
            }
            Ok(_) => {}
        }
        self.next_byte_index = 0;
    }

    pub fn write_hash(&mut self, hash: BoardHash) {
        let mut serialized_hash = hash.serialize();
        let shift_amount = size_of::<u64>() - size_of::<u8>();
        let byte_bitmask = u64::MAX << shift_amount;
        for _ in 0..(size_of::<u64>() / size_of::<u8>()) {
            let byte = ((serialized_hash & byte_bitmask) >> shift_amount) as u8;
            serialized_hash = serialized_hash << size_of::<u8>();

            self.write_buffer[self.next_byte_index] = byte;
            self.next_byte_index += 1;
        }
        if self.next_byte_index > self.write_buffer.len() {
            panic!("This should be impossible: next_write_index out of bounds");
        }
        if self.next_byte_index == self.write_buffer.len() {
            self.flush();
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

    let mut hash_writer = HashWriter::new();
    visit_children(Board::new_empty(), &mut visited_boards, &mut hash_writer);
    hash_writer.flush();
    println!("Done");
}
