# Fractogram Generator

Generates word squares for the Fractograms game. This is done ahead of time to
prevent unnecessary computation on the client.

## Usage

[Install Rust](https://rustup.rs/). Default rust is fine, nightly is not
required.

A standard `cargo run` will technically run it, and `cargo run -r` will make it
a *lot* faster, but I like to split it up into two commands as shown below so
that I can see how long it takes to run. Takes one to several minutes on most
machines.

```
cargo build -r
time ./target/release/fractogram_generator > some_output_file.txt
```



## Basic algorithm

This custom algorithm is inspired by
[AC-3](https://en.wikipedia.org/wiki/AC-3_algorithm) (and previous versions have
used exactly that), but this version contains a few tweaks that help with
performance a little. These videos are a good primer if you're curious:

- [Constraint satisfaction](https://www.youtube.com/watch?v=_e64FiDWvqs)
(defines a lot of the terms in the next video)
- [AC-3](https://www.youtube.com/watch?v=4cCS8rrYT14)

The algorithm is at heart a recursive guess-and-check search with backtracking,
but there's an important filter step that speeds things up by allowing us to
skip a lot of dead-end branches of the search tree.

The gist is that we keep a set of words for each row and column that represents
words that we might be able to place in that row/column, given what we already
know. Every time we make a guess we remove words from those sets that could no
longer be a part of the solution.

Let's say the algorithm starts off by guessing `"APPLE"` for `row[0]`. Now we
can go through each of the column sets and filter out words that don't make
sense any more. For example we can remove every word from `col[0]` that doesn't
start with `"A"`, any word from `col[1]` and `col[2]` that doesn't start with
`"P"`, and so on.

We don't have to wait for a row/col to be completely decided before
we filter the opposing rows/columns. Let's imagine that based on previous
guesses we've narrowed down `row[0]` to 2 words; `"APPLE"` and `"BACON"`. We
could then remove anything from `col[0]` that doesn't start with `"A"` or `"B"`,
anything from `col[1]` that doesn't start with `"P"` or `"A"`, anything from
`col[2]` that doesn't start with `"P"` or `"C"`, and so on.

Similarly, once the columns' possible word sets have been filtered,
we can go the other direction and filter the row sets based on what letters
remain in the column sets.

The filter process goes back and forth filtering the column sets based on what
remains in the row sets, and then filtering the row sets based on what remains
in the column sets. It continues until one of the following happens:

1. We reach a state where any/all of the row/column sets are empty. This means
    we didn't find a solution and must backtrack: undo one of our previous
    guesses and try a different word.
2. We reach a state where all row/column sets have exactly one word left. This
    means we've found a solution and should return it.
3. We reach an equilibrium where filtering no longer has an effect. We must then
    make another guess and start the process anew. However, we will make a guess
    from the newly-reduces word sets, which should significantly reduce the
    number of words we have to try (i.e. the search space is reduced).

Note that making a guess for all 5 rows is sufficient; we don't also have to
make 5 column guesses because once all 5 rows are present they define the values
that the columns must have.

In Python-ish pseduocode:

```python
def searchTree(rowIndex, possibleWordSets):
    if possibleWordSets.isAnyEmpty():
        # Yield nothing, let recursion do our backtracking for us
        return
    if rowIndex == 4:
        # We could equivalently check if all sets in possibleWordSets have
        # size == 1
        yield possibleWordSets
        return
    for possibleWord in possibleWordsSet.rows[rowIndex]:
        childWordSet = possibleWordsSet.clone()
        # Making a guess for a row is equivalent to removing all of the other
        # possibilities from that row
        childWordSet.rows[rowIndex] = set(possibleWord)
        somethingChanged = True
        # Continue whittling down childWordSet until it has no effect
        while somethingChanged:
            somethingChanged = (childWordSet.filterColumns() or
                childWordSet.filterRows())
        # Recurse to make a guess for the next row
        for solution in searchTree(rowIndex + 1, childWordSet):
            yield solution

ALL_POSSIBILITIES = {
    rows = [set(ALL_WORDS) for i in range(5)],
    cols = [set(ALL_WORDS) for i in range(5)]
}
for result in searchTree(0, ALL_POSSIBILITIES):
    print(result)
```

