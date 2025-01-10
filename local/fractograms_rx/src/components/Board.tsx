// import { BkpDragEvent } from "../bkp_drag_drop/events.ts";
// import { AppState } from "../data_structures/app_state.ts";

import { useEffect, useRef } from "react";
import { BKP_DROP_TARGET_ATTR } from "../bkp_drag_drop/drag_drop_service.ts";
import { BKP_DROP, BkpDragEvent } from "../bkp_drag_drop/events.ts";
import { BORDER_WIDTH, CELL_WIDTH_PX } from "../util/consts.ts";
import { WORD_SIZE } from "../data/solutions.ts";
import { iterNested } from "../util/iter_util.ts";
import "./Board.css";

interface BoardProps {
  // appState: AppState;
  onDrop: (e: BkpDragEvent) => void;
}

export default function Board({ onDrop }: BoardProps) {
  const boardRef = useRef(null as unknown as SVGPathElement);

  const onDropWrapper = (e: Event) => {
    onDrop(e as BkpDragEvent);
  };

  useEffect(() => {
    const el = boardRef.current;
    el.setAttribute(BKP_DROP_TARGET_ATTR, "true");

    el.addEventListener(BKP_DROP, onDropWrapper);

    return () => {
      el.removeEventListener(BKP_DROP, onDropWrapper);
    };
  });

  // Shift most y-coordinates down to account for thicker borders
  const shiftY = BORDER_WIDTH / 2;

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
