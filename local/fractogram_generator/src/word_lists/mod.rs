mod read_bkp_words;

use std::collections::HashSet;

use read_bkp_words::read_bkp_words;

pub fn all_words() -> HashSet<String> {
    let mut result: HashSet<String> = HashSet::new();
    for word in read_bkp_words().iter() {
        result.insert(word.to_ascii_uppercase());
    }
    result
}
