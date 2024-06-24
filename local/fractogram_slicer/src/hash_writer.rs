use std::{fs::File, io::Write, mem::size_of, path::Path};

use crate::board_hash::{BoardHash, SerializedHash};

// Aim for 3kb per .slice file (arbitrary size)
const MAX_HASHES_PER_FILE: usize = (1024 * 3) / size_of::<SerializedHash>();

pub struct HashWriter<'a> {
    current_file_index: usize,
    write_buffer:
        [u8; MAX_HASHES_PER_FILE * size_of::<u64>() / size_of::<u8>()],
    next_byte_index: usize,
    num_hashes_written: u64,
    dest: &'a str,
}

impl<'a> HashWriter<'a> {
    pub fn new(dest: &'a str) -> HashWriter {
        HashWriter {
            current_file_index: 0,
            write_buffer: [0; MAX_HASHES_PER_FILE * size_of::<u64>()
                / size_of::<u8>()],
            next_byte_index: 0,
            num_hashes_written: 0,
            dest,
        }
    }

    pub fn flush(&mut self) {
        let file_name = format!("{:06}.slice", self.current_file_index);
        let file_path = Path::new(&file_name);
        let dest_path = Path::new(self.dest);
        let full_path = dest_path.join(&file_name);
        self.current_file_index += 1;
        let mut file = match File::create(&full_path) {
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
        self.num_hashes_written += 1;
        let serialized_hash = hash.serialize();
        for byte in serialized_hash.to_be_bytes() {
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

    pub fn get_num_hashes_written(&self) -> u64 {
        self.num_hashes_written
    }
}
