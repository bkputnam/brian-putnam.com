import { BkpDragEvent } from "../bkp_drag_drop/events.ts";
import { AppState } from "../data_structures/app_state.ts";

interface BoardProps {
  appState: AppState;
  onDrop: (e: BkpDragEvent) => void;
}

export default function Board({ appState, onDrop }: BoardProps) {
  //   return <g id="board" bkp-drop-target="true" onbkpdrop={onDrop}></g>;
  return <div foo="bar"></div>;
}
