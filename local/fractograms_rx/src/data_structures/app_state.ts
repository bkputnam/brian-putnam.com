import { RowCol } from "./coords.ts";
import { SliceData } from "./slice.ts";

export interface AppState {
  slices: SliceData[];

  // Maps placed Slices to the coords they were placed at.
  // - Unplaced Slices will appear in `this.slices` but not in `this.board`.
  // - Slices will be placed according to where the top-left corner of their
  //     *bounding box* lands, which may be outside of the shape itself (e.g.
  //     for upside-down T tetromino).
  // - This means that it's possible for two Slices to have the same coord,
  //    but not overlap. E.g. an upside-down T at (1, 1) would not overlap a
  //    1x1 piece at (1, 1) because the T doesn't actually fill the (1, 1)
  //    coord. That coord is just used as a positioning reference.
  board: Map<SliceData, RowCol>;
}
