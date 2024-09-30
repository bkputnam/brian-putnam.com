use board::Board;
use rayon::prelude::*;

mod board;
mod consts;
mod word_lists;

fn main() {
    let all_words = word_lists::all_words();
    let root_board = Board::new(&all_words);

    let mut results: Vec<String> = root_board.rows[0]
        .par_iter()
        .flat_map(|word_0: &&str| -> Vec<String> {
            let mut child_1 = Board::with_capacity(&all_words);
            let mut child_2 = Board::with_capacity(&all_words);
            let mut child_3 = Board::with_capacity(&all_words);
            let mut child_4 = Board::with_capacity(&all_words);
            let mut child_5 = Board::with_capacity(&all_words);

            let mut results: Vec<String> = vec![];
            root_board.set_row(0, word_0, &mut child_1);
            for word_1 in &child_1.rows[1] {
                child_1.set_row(1, word_1, &mut child_2);
                for word_2 in &child_2.rows[2] {
                    child_2.set_row(2, word_2, &mut child_3);
                    for word_3 in &child_3.rows[3] {
                        child_3.set_row(3, word_3, &mut child_4);
                        for word_4 in &child_4.rows[4] {
                            // Need to call set_row one more time to make sure
                            // that the last word is valid.
                            child_4.set_row(4, word_4, &mut child_5);
                            if child_5.is_complete() {
                                results
                                    .push(format!("{}", child_5.to_string()));
                            }
                        }
                    }
                }
            }
            results
        })
        .collect::<Vec<String>>();

    results.sort();

    for result in &results {
        println!("{}\n", result);
    }

    println!("\nDone: {} results", results.len());
}
