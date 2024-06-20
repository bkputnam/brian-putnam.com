# Fractogram Generator

This script will attempt to enumerate all possible ways to split a 5x5 puzzle up
into pieces. Most pieces will be
[tetrominoes](https://en.wikipedia.org/wiki/Tetromino) but there will always be
some leftover pieces that have < 4 letters.

## To run

First, [install Rust](https://www.rust-lang.org/tools/install). Then:

```
cd fractogram_generator
cargo run
```