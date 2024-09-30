use core::fmt;
use std::{collections::HashSet, fmt::Formatter, iter::once};

use crate::consts::WORD_SIZE;

#[derive(Clone)]
pub struct Board<'a> {
    pub rows: [HashSet<&'a str>; WORD_SIZE],
    pub cols: [HashSet<&'a str>; WORD_SIZE],
}

impl<'a> Board<'a> {
    pub fn new(all_words: &'a HashSet<String>) -> Board<'a> {
        let as_refs: HashSet<&'a str> =
            all_words.iter().map(|s: &String| s.as_str()).collect();
        let mut result = Board {
            rows: [
                as_refs.clone(),
                as_refs.clone(),
                as_refs.clone(),
                as_refs.clone(),
                as_refs.clone(),
            ],
            cols: [
                as_refs.clone(),
                as_refs.clone(),
                as_refs.clone(),
                as_refs.clone(),
                as_refs.clone(),
            ],
        };
        result.make_consistent();
        result
    }

    pub fn with_capacity(all_words: &'a HashSet<String>) -> Board<'a> {
        let capacity = all_words.len();
        Board {
            rows: [
                HashSet::with_capacity(capacity),
                HashSet::with_capacity(capacity),
                HashSet::with_capacity(capacity),
                HashSet::with_capacity(capacity),
                HashSet::with_capacity(capacity),
            ],
            cols: [
                HashSet::with_capacity(capacity),
                HashSet::with_capacity(capacity),
                HashSet::with_capacity(capacity),
                HashSet::with_capacity(capacity),
                HashSet::with_capacity(capacity),
            ],
        }
    }

    /**
     * Makes the board self-consistent by filtering out words from each row and
     * column that don't meet our criteria.
     */
    fn make_consistent(&mut self) {
        loop {
            // settle() won't return until it has done a pass where nothing
            // changed, and so we don't need to check if something changed here.
            self.settle();

            if !self.remove_duplicates() {
                break;
            }
        }
    }

    /**
     * Removes words that couldn't be in the final solution because one or more
     * of their letters is no longer available in the opposing row or column.
     *
     * First this filters the remaining words in each row, by comparing against
     * the remaining words in the columns. Then it filters the columns by the
     * remaining words in the rows. It repeats this process until both the row
     * filtering step and the column filtering step produce no changes.
     */
    fn settle(&mut self) {
        loop {
            let mut something_changed = false;

            for row_index in 0..WORD_SIZE {
                if filter_against(
                    &mut self.rows[row_index],
                    row_index,
                    &self.cols,
                ) {
                    something_changed = true;
                }
            }

            for col_index in 0..WORD_SIZE {
                if filter_against(
                    &mut self.cols[col_index],
                    col_index,
                    &self.rows,
                ) {
                    something_changed = true;
                }
            }

            if !something_changed {
                break;
            }
        }
    }

    /**
     * Searches through all rows and cols for words that are already claimed,
     * and removes them from the other rows and cols so that we don't search
     * through solutions containing duplicate words.
     *
     * A word is "claimed" if a row or col has that word as the only remaining
     * value in its set of possible words.
     */
    fn remove_duplicates(&mut self) -> bool {
        let mut rows_and_cols: Vec<&mut HashSet<&str>> =
            self.rows.iter_mut().chain(self.cols.iter_mut()).collect();
        let mut used_words: Vec<&str> = Vec::new();
        let mut used_words_owner: Vec<usize> = Vec::new();
        for (index, row_or_col) in rows_and_cols.iter().enumerate() {
            if row_or_col.len() == 1 {
                let used_word = row_or_col.iter().next().unwrap();
                if !used_words.contains(used_word) {
                    used_words.push(used_word);
                    used_words_owner.push(index);
                }
            }
        }
        if used_words.len() == 0 {
            return false;
        }
        let mut something_changed = false;
        for (used_word, owner_index) in
            used_words.iter().zip(used_words_owner.iter())
        {
            for (index, row_or_col) in rows_and_cols.iter_mut().enumerate() {
                if index == *owner_index {
                    continue;
                }
                if row_or_col.remove(used_word) {
                    something_changed = true;
                }
            }
        }
        something_changed
    }

    pub fn clear(&mut self) {
        for row in self.rows.iter_mut() {
            row.clear();
        }
        for col in self.cols.iter_mut() {
            col.clear();
        }
    }

    pub fn is_empty(&self) -> bool {
        for row in self.rows.iter() {
            if row.len() == 0 {
                return true;
            }
        }
        for col in self.cols.iter() {
            if col.len() == 0 {
                return true;
            }
        }
        false
    }

    pub fn is_complete(&self) -> bool {
        for row in self.rows.iter() {
            if row.len() != 1 {
                return false;
            }
        }
        for col in self.cols.iter() {
            if col.len() != 1 {
                return false;
            }
        }
        true
    }

    pub fn set_row(
        &self,
        row_index: usize,
        word: &'a str,
        child_board: &mut Board<'a>,
    ) {
        if self.is_empty() {
            panic!("Can't set_row({}, {}) in empty board", row_index, word);
        }
        if !self.rows[row_index].contains(word) {
            panic!(
                "Can't set_row({}, {}): word isn't in that row set\n\n{}",
                row_index,
                word,
                self.to_string(),
            );
        }

        child_board.clear();
        for (index, row) in self.rows.iter().enumerate() {
            if index == row_index {
                child_board.rows[index].extend(once(word));
            } else {
                child_board.rows[index].extend(row.iter());
            }
        }
        for (index, col) in self.cols.iter().enumerate() {
            child_board.cols[index].extend(col.iter());
        }
        child_board.make_consistent();
    }
}

impl<'a> fmt::Display for Board<'a> {
    fn fmt(&self, f: &mut Formatter<'_>) -> Result<(), std::fmt::Error> {
        if self.is_empty() {
            f.write_str("Empty Board")
        } else if self.is_complete() {
            let mut lines: Vec<String> = Vec::new();
            for row in self.rows.iter() {
                lines.push(row.iter().nth(0).unwrap().to_string());
            }
            f.write_str(&lines.join("\n"))
        } else {
            // let mut result = String::from_str("Board {").unwrap();
            let mut lines: Vec<String> = Vec::new();
            lines.push("Board {".to_string());
            for (index, row) in self.rows.iter().enumerate() {
                let val: String = if row.len() == 1 {
                    row.iter().next().unwrap().to_string()
                } else {
                    format!("{} values", row.len())
                };
                lines.push(format!("row[{}]: {}", index, val));
            }
            for (index, col) in self.cols.iter().enumerate() {
                let val: String = if col.len() == 1 {
                    col.iter().next().unwrap().to_string()
                } else {
                    format!("{} values", col.len())
                };
                lines.push(format!("col[{}]: {}", index, val));
            }
            lines.push("\n}".to_string());
            f.write_str(&lines.join("\n"))
        }
    }
}

/**
 * Filters a word set by comparing it to word sets on the opposite axis;
 * e.g. filters rows by looking at what letters are available in the column
 * word sets, or vice versa.
 */
fn filter_against(
    to_filter: &mut HashSet<&str>,
    self_index: usize,
    opposite_words: &[HashSet<&str>; WORD_SIZE],
) -> bool {
    let mut something_changed = false;
    let mut opposite_letters: HashSet<char> = HashSet::new();
    for op_index in 0..WORD_SIZE {
        opposite_letters.clear();
        for word in opposite_words[op_index].iter() {
            opposite_letters.insert(word.chars().nth(self_index).unwrap());
        }
        to_filter.retain(|word| {
            let keep =
                opposite_letters.contains(&word.chars().nth(op_index).unwrap());
            if !keep {
                something_changed = true;
            }
            keep
        });
    }
    something_changed
}
