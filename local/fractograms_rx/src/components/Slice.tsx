import { useEffect, useRef } from "react";
import { SliceData } from "../data_structures/slice.ts";
import { computeOutlinePath } from "../util/svg_path_util.ts";
import {
  BKP_DRAG,
  BKP_DRAG_END,
  BKP_DRAG_START,
  BkpDragEvent,
} from "../bkp_drag_drop/events.ts";
import { BORDER_WIDTH, CELL_WIDTH_PX } from "../util/consts.ts";
import "./Slice.css";
import {
  CssTransformCoords,
  ScreenCoord,
  toTranslateStr,
} from "../data_structures/coords.ts";
import { getTranslateXY } from "../util/svg_utils.ts";
import { Z_INDICES } from "../util/z_indices.ts";

interface SliceProps {
  slice: SliceData;
  index: number;
  initialTranslate: ScreenCoord;
}

export default function Slice({ slice, index, initialTranslate }: SliceProps) {
  const gRef = useRef(null as unknown as SVGPathElement);
  const outlinePath = computeOutlinePath(slice.letters);
  const translate = useRef({
    translateX: initialTranslate.x,
    translateY: initialTranslate.y,
  } as CssTransformCoords);
  const dragStartCoords = useRef(null as CssTransformCoords | null);

  function dragStart(e: Event) {
    const dragEvent = e as BkpDragEvent;
    dragStartCoords.current = getTranslateXY(
      dragEvent.target as SVGGraphicsElement
    );

    // Make el the last child inside of parentEl, so that it stays on top
    const gEl = gRef.current;
    const parentEl = gEl.parentElement;
    gEl.remove();
    parentEl?.appendChild(gEl);
  }

  function drag(e: Event) {
    if (!dragStartCoords.current) {
      return;
    }
    const detail = (e as BkpDragEvent).detail;
    const deltaX = detail.curPos.x - detail.startPos.x;
    const deltaY = detail.curPos.y - detail.startPos.y;
    const translateX = dragStartCoords.current.translateX + deltaX;
    const translateY = dragStartCoords.current.translateY + deltaY;
    translate.current = { translateX, translateY };
    gRef.current.setAttribute("transform", toTranslateStr(translate.current));
  }

  function dragEnd(e: Event) {
    if (!dragStartCoords.current) {
      return;
    }
    dragStartCoords.current = null;
  }

  useEffect(() => {
    const gEl = gRef.current as SVGElement;
    gEl.setAttribute("bkp-draggable", "true");
    gEl.setAttribute("bkp-draggable", "true");
    gEl.addEventListener(BKP_DRAG_START, dragStart);
    gEl.addEventListener(BKP_DRAG, drag);
    gEl.addEventListener(BKP_DRAG_END, dragEnd);

    return () => {
      gEl.removeEventListener(BKP_DRAG_START, dragStart);
      gEl.removeEventListener(BKP_DRAG, drag);
      gEl.removeEventListener(BKP_DRAG_END, dragEnd);
    };
  });

  const letterConfigs = [];
  for (let row = 0; row < slice.height; row++) {
    for (let col = 0; col < slice.width; col++) {
      const letterOrNull = slice.letters[row][col];
      if (!letterOrNull) {
        continue;
      }
      letterConfigs.push({ letter: letterOrNull, row, col });
    }
  }

  return (
    <g
      className={`piece p${index}`}
      transform={toTranslateStr(translate.current)}
      ref={gRef}
    >
      <path d={outlinePath} />
      {letterConfigs.map(({ letter, row, col }) => {
        const shiftX = CELL_WIDTH_PX / 2;
        const shiftY = CELL_WIDTH_PX / 2;

        return (
          <text
            key={`${row}.${col}`}
            className="letter"
            x={col * (CELL_WIDTH_PX + BORDER_WIDTH) + shiftX}
            y={row * (CELL_WIDTH_PX + BORDER_WIDTH) + shiftY}
            textAnchor="middle"
            dominantBaseline="mathematical"
          >
            {letter}
          </text>
        );
      })}
    </g>
  );
}
