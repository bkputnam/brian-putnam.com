import { AppState } from "../data_structures/app_state.ts";
import {
  CssTransformCoords,
  RowCol,
  ScreenCoord,
} from "../data_structures/coords.ts";
import { BORDER_WIDTH, CELL_WIDTH_PX } from "../util/consts.ts";

interface DropAction {
  type: "drop";
  sliceIndex: number;
  transformCoords: CssTransformCoords;
}

type Action = DropAction;

export function appStateReducer(appState: AppState, action: Action): AppState {
  throw new Error("Not implemented");
  // const result = structuredClone(appState);
  // switch (action.type) {
  //   case "drop":
  //     return handleDropAction(result, action);
  //   default:
  //     throw new Error(`Unrecognized Action type: ${action.type}`);
  // }
}

// function handleDropAction(result: AppState, action: DropAction): AppState {
//   debugger;

//   const slice = result.slices[action.sliceIndex];
//   const rowCol = svgToBoardCoords(action.transformCoords);
//   const success = tryPlaceSlice(rowCol);

//   return result;
// }

// function svgToBoardCoords(coord: CssTransformCoords): RowCol {
//   const cb = CELL_WIDTH_PX + BORDER_WIDTH;
//   return {
//     row: Math.round((coord.translateY - 0.5 * BORDER_WIDTH) / cb),
//     col: Math.round((coord.translateX + 2.5 * cb) / cb),
//   };
// }

// function tryPlaceSlice(coord: RowCol): boolean {
//   const success =
// }
