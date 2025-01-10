import { WORD_SIZE } from "../data/solutions.ts";
import { LetterCoord, RowCol } from "./coords.ts";
import { iterCoords, SliceData } from "./slice.ts";

export type BoardData = Map<SliceData, RowCol>;

function* iterSliceLetters(
  slice: SliceData,
  coord: RowCol
): Iterable<LetterCoord> {
  for (const { letter, coord: pieceCoord } of iterCoords(slice)) {
    const resultCoord = {
      row: coord.row + pieceCoord.row,
      col: coord.col + pieceCoord.col,
    };
    yield { letter, coord: resultCoord };
  }
}

function isCoordInBounds(coord: RowCol): boolean {
  return (
    coord.row >= 0 &&
    coord.row < WORD_SIZE &&
    coord.col >= 0 &&
    coord.col < WORD_SIZE
  );
}

function isSliceInBounds(slice: SliceData, coord: RowCol): boolean {
  if (!isCoordInBounds(coord)) {
    return false;
  }
  const maxCoord = {
    row: coord.row + slice.height - 1,
    col: coord.col + slice.width - 1,
  };
  return isCoordInBounds(maxCoord);
}

export function tryPlaceSlice(
  board: BoardData,
  slice: SliceData,
  coord: RowCol
): boolean {
  if (!isSliceInBounds(slice, coord)) {
    return false;
  }
  const letterCoords = [...iterSliceLetters(slice, coord)];
  for (const {coord: sliceCoord} of letterCoords) {
    if (board.)
  }
}
