import { ScreenCoord } from "../data_structures/coords.ts";

export const BKP_DRAG_START = "bkpdragstart";
export const BKP_DRAG = "bkpdrag";
export const BKP_DRAG_END = "bkpdragend";
export const BKP_DROP = "bkpdrop";

type BkpDragEventType =
  | typeof BKP_DRAG_START
  | typeof BKP_DRAG
  | typeof BKP_DRAG_END
  | typeof BKP_DROP;

export interface DragDetail {
  eventType: BkpDragEventType;
  startPos: ScreenCoord;
  curPos: ScreenCoord;
  id?: string;
}

export class BkpDragEvent extends CustomEvent<DragDetail> {
  constructor(detail: DragDetail) {
    super(detail.eventType, {
      detail,
      bubbles: false,
      cancelable: true,
    });
  }
}
