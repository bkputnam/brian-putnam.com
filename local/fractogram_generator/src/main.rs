use board::Board;

mod board;
mod consts;
mod word_lists;

fn iter_children<'a, F: FnMut(Board<'a>) -> ()>(
    board: &Board<'a>,
    callback: &mut F,
) {
    let target_row = board.first_editable_row();
    for word in board.rows[target_row].iter() {
        let child = board.set_row(target_row, word);
        if child.is_empty() {
            continue;
        } else if child.is_complete() {
            callback(child);
        } else {
            iter_children(&child, callback);
        }
    }
}

fn iter_root_children<'a, F: FnMut(Board<'a>, f64) -> ()>(
    board: &Board<'a>,
    callback: &mut F,
) {
    let total_children = board.rows[0].len() as f64;
    let target_row = board.first_editable_row();
    for (i, word) in board.rows[target_row].iter().enumerate() {
        let child = board.set_row(target_row, word);
        if child.is_empty() {
            continue;
        } else if child.is_complete() {
            // Pretty sure this is impossible
            callback(child, i as f64 / total_children);
        } else {
            iter_children(&child, &mut |board| {
                callback(board, i as f64 / total_children);
            });
        }
    }
}

fn main() {
    let all_words = word_lists::all_words();

    let root_board = Board::new(&all_words);
    let mut num_results: u32 = 0;
    iter_root_children(&root_board, &mut |board: Board, progress: f64| {
        num_results += 1;
        println!("{}", board);
        println!("{:.2}%", progress * 100.0);
    });

    println!("\nDone: {} results", num_results);
}
