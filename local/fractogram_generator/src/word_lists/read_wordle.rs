use std::{fs::read_to_string, path::Path};

const FILE_NAME: &str = "word_lists/wordle_answers.txt";

pub fn read_wordle_answers() -> Vec<String> {
    let path = Path::new(FILE_NAME);
    let file_contents = match read_to_string(&path) {
        Err(reason) => {
            panic!("Couldn't open {}: {}", FILE_NAME, reason);
        }
        Ok(file_contents) => file_contents,
    };
    file_contents.lines().map(|line| line.to_string()).collect()
}
