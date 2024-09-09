// mod read_teowl;
mod read_wordfrequency;

use std::collections::HashSet;

// use read_teowl::read_teowl_words;
use read_wordfrequency::read_words;

pub fn all_words() -> HashSet<String> {
    let mut result: HashSet<String> = HashSet::new();
    for word in read_words().iter() {
        result.insert(word.to_ascii_uppercase());
    }
    result
}
