import { useReducer } from "react";
import "./PlayArea.css";
import { AppState } from "../data_structures/app_state.ts";
import { RowCol } from "../data_structures/coords.ts";
import { SliceData } from "../data_structures/slice.ts";
import Board from "./Board.tsx";
import Slice from "./Slice.tsx";
import { appStateReducer } from "./AppStateReducer.ts";
import { BkpDragEvent } from "../bkp_drag_drop/events.ts";

export default function PlayArea() {
  const [gameState, dispatchGameState] = useReducer(appStateReducer, {
    slices: [
      {
        width: 2,
        height: 3,
        letters: [
          ["A", null],
          ["B", null],
          ["C", "D"],
        ],
      },
      {
        width: 3,
        height: 2,
        letters: [
          ["E", "F", "G"],
          ["H", null, null],
        ],
      },
      {
        width: 1,
        height: 1,
        letters: [["I"]],
      },
    ],
    board: new Map<SliceData, RowCol>(),
  } as const satisfies AppState);

  const onDrop = (e: BkpDragEvent) => {
    dispatchGameState({
      type: "drop",
      sliceIndex: Number(e.detail.id),
      pos: e.detail.curPos,
    });
  };

  return (
    <svg id="play-area-svg">
      <svg id="centering-svg" x="50%">
        <Board onDrop={onDrop}></Board>
        {gameState.slices.map((slice, index) => {
          return (
            <Slice
              slice={slice}
              index={index}
              key={index}
              initialTranslate={{ x: -200 + 150 * index, y: 150 * index }}
            />
          );
        })}
      </svg>
    </svg>
  );
}
