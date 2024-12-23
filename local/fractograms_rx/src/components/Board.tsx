// import { BkpDragEvent } from "../bkp_drag_drop/events.ts";
// import { AppState } from "../data_structures/app_state.ts";

import { useEffect, useRef } from "react";
import { BKP_DROP_TARGET_ATTR } from "../bkp_drag_drop/drag_drop_service.ts";
import { BKP_DROP } from "../bkp_drag_drop/events.ts";
import { BORDER_WIDTH, CELL_WIDTH_PX } from "../util/consts.ts";
import { WORD_SIZE } from "../data/solutions.ts";
import { iterNested } from "../util/iter_util.ts";
import "./Board.css";

// interface BoardProps {
//   appState: AppState;
//   onDrop: (e: BkpDragEvent) => void;
// }

export default function Board() {
  const boardRef = useRef(null as unknown as SVGPathElement);

  function onDrop(e: Event) {
    debugger;
  }

  useEffect(() => {
    const el = boardRef.current;
    el.setAttribute(BKP_DROP_TARGET_ATTR, "true");

    el.addEventListener(BKP_DROP, onDrop);

    return () => {
      el.removeEventListener(BKP_DROP, onDrop);
    };
  });

  // Shift most y-coordinates down to account for thicker borders
  const shiftY = BORDER_WIDTH / 2;
  const maxOffset = WORD_SIZE * (CELL_WIDTH_PX + BORDER_WIDTH) + shiftY;

  return (
    <g id="board" ref={boardRef}>
      {[...iterNested(WORD_SIZE, WORD_SIZE)].map(([row, col]) => {
        const xOffset = col * (CELL_WIDTH_PX + BORDER_WIDTH);
        const yOffset = row * (CELL_WIDTH_PX + BORDER_WIDTH);

        return (
          <rect
            key={`${row}.${col}`}
            x={xOffset}
            y={yOffset + shiftY}
            width={CELL_WIDTH_PX + BORDER_WIDTH}
            height={CELL_WIDTH_PX + BORDER_WIDTH}
            stroke="black"
            strokeWidth={BORDER_WIDTH}
            className="cell"
          ></rect>
        );
      })}
    </g>
  );
}
