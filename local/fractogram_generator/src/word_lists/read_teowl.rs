use std::{fs::read_to_string, path::Path};

const TEOWL_DIR: &str =
    "word_lists/The-English-Open-Word-List/EOWL LF Delimited Format";
const ALPHABET: &str = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

pub fn read_teowl_words() -> Box<dyn Iterator<Item = String>> {
    let file_root = Path::new(TEOWL_DIR);
    let lines_iter = ALPHABET.chars().flat_map(|letter| {
        let file_name = format!("{} Words.txt", letter);
        let file_path = Path::new(&file_name);
        let full_path = file_root.join(file_path);
        let file_contents = match read_to_string(&full_path) {
            Err(reason) => {
                panic!("Couldn't open {}: {}", full_path.display(), reason);
            }
            Ok(file_contents) => file_contents,
        };
        file_contents
            .lines()
            .map(|line| line.to_owned())
            .collect::<Vec<String>>()
    });
    let five_letter_words = lines_iter
        .filter(|word: &String| word.len() == 5 && word.chars().count() == 5);
    Box::new(five_letter_words)
}
