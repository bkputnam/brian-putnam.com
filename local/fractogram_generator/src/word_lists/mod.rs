// mod read_teowl;
mod read_wordle;

use std::collections::HashSet;

// use read_teowl::read_teowl_words;
use read_wordle::read_wordle_answers;

pub fn all_words() -> HashSet<String> {
    let mut result: HashSet<String> = HashSet::new();
    for word in read_wordle_answers().iter() {
        result.insert(word.to_ascii_uppercase());
    }
    result
}
