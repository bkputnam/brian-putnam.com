import { ScreenCoord } from "../data_structures/coords.ts";

export function boxContainsPoint(box: DOMRect, coord: ScreenCoord): boolean {
  return (
    coord.x >= box.x &&
    coord.x <= box.x + box.width &&
    coord.y >= box.y &&
    coord.y <= box.y + box.height
  );
}

export interface DomRectLike {
  x: number;
  y: number;
  width: number;
  height: number;
}

export function boxesIntersect(box1: DomRectLike, box2: DomRectLike): boolean {
  if (box1.x >= box2.x + box2.width) {
    // box1 is entirely right of box2
    return false;
  }
  if (box2.x >= box1.x + box1.width) {
    // box1 is entirely left of box2
    return false;
  }
  if (box1.y >= box2.y + box2.height) {
    // box1 is entirely below box2
    return false;
  }
  if (box2.y >= box1.y + box1.height) {
    // box1 is entirely above box2
    return false;
  }
  return true;
}
