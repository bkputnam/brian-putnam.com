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

    fn make_consistent(&mut self) {
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

    pub fn set_row(&self, row_index: usize, word: &'a str) -> Board<'a> {
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

        let mut result = self.clone();
        result.rows[row_index] = HashSet::from_iter(once(word));
        result.make_consistent();

        result
    }

    pub fn first_editable_row(&self) -> usize {
        for (index, row) in self.rows.iter().enumerate() {
            if row.len() > 1 {
                return index;
            }
        }
        if self.is_empty() {
            panic!("Couldn't get first_editable_row: board is empty");
        }
        if self.is_complete() {
            panic!("Couldn't get first_editable_row: board is complete");
        }
        panic!("This should be impossible");
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
        let mut to_remove: Vec<&str> = Vec::new();
        for word in to_filter.iter() {
            let keep =
                opposite_letters.contains(&word.chars().nth(op_index).unwrap());
            if !keep {
                to_remove.push(word);
            }
        }
        if to_remove.len() > 0 {
            something_changed = true;
        }
        for word in to_remove {
            to_filter.remove(word);
        }
    }
    something_changed
}
