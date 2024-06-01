import { ScreenCoord } from "../data_structures/coord.js";

export function boxContainsPoint(box: DOMRect, coord: ScreenCoord):
    boolean {
    return (
        coord.x >= box.x &&
        coord.x <= (box.x + box.width) &&
        coord.y >= box.y &&
        coord.y <= (box.y + box.height)
    );
}
