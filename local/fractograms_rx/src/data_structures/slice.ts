import { CssTransformCoords, LetterCoord } from "./coords.ts";

export interface SliceData {
  width: number;
  height: number;
  letters: Array<Array<string | null>>;

  // Will only be non-null if this Slice has been placed on the Board. These
  // coords represent the snapped-to location that is computed after the drop
  // action
  pos: CssTransformCoords | null;
}

export function* iterCoords(slice: SliceData): Iterable<LetterCoord> {
  for (let row = 0; row < slice.letters.length; row++) {
    for (let col = 0; col < slice.letters[0].length; col++) {
      const letter = slice.letters[row][col];
      if (letter !== null) {
        yield {
          letter,
          coord: { row, col },
        };
      }
    }
  }
}
