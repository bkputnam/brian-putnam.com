import { ScreenCoord } from "../data_structures/coord.js";
import { boxContainsPoint } from "../util/geometry.js";
import { BKP_DRAG, BKP_DRAG_END, BKP_DRAG_START, BKP_DROP, BkpDragEvent, DragDetail } from "./events.js";

interface DragInfo {
    identifier: number;
    el: HTMLElement;
    startPos: ScreenCoord;
    dropController?: unknown;
}

class DragDropService {
    private readonly claimedEls = new Set<HTMLElement>();
    private readonly drags = new Map<number, DragInfo>();

    constructor() {
        initGlobalMouseListeners();
        initGlobalTouchListeners();
    }

    /**
     * Starts a drag operation. Returns true if a drag was successfully started,
     * or false if a drag wasn't started, e.g. because the event happened to a
     * non-draggable element.
     */
    startDrag(
        id: number, targetEl: HTMLElement, startPos: ScreenCoord): boolean {
        const el =
            targetEl.closest(`[${BKP_DRAGGABLE_ATTR}="true"]`) as HTMLElement;
        if (!el) {
            // It's pretty common to hit this check and exit early. Happens any
            // time you click or touch something that isn't [draggable="true"].
            return false;
        }
        if (this.claimedEls.has(el)) {
            console.warn(
                `[BKP] Attempting to drag an Element already being dragged`,
                el);
            return false;
        }
        this.claimedEls.add(el);
        const dragInfo: DragInfo = {
            identifier: id,
            el,
            startPos,
        };
        const detail: DragDetail = {
            eventType: BKP_DRAG_START,
            startPos,
            curPos: startPos,
        };
        el.dispatchEvent(new BkpDragEvent(detail));
        dragInfo.dropController = detail.dropController;
        this.drags.set(id, dragInfo);
        return true;
    }

    moveDrag(id: number, curPos: ScreenCoord) {
        const dragInfo = this.drags.get(id);
        if (!dragInfo) {
            console.error(`[BKP] Attempting moveDrag on unknown id "${id}"`);
            return;
        }
        dragInfo.el.dispatchEvent(new BkpDragEvent({
            eventType: BKP_DRAG,
            startPos: dragInfo.startPos,
            curPos,
        }));
    }

    endDrag(id: number, endPos: ScreenCoord) {
        const dragInfo = this.drags.get(id);
        if (!dragInfo) {
            console.error(`[BKP] Attempting endDrag on unknown id "${id}"`);
            return;
        }
        this.drags.delete(id);
        this.claimedEls.delete(dragInfo.el);

        const dropTargetSelector = `[${BKP_DROP_TARGET_ATTR}="true"]`;
        const dropTargets = document.elementsFromPoint(endPos.x, endPos.y)
            .filter((el: Element) =>
                el.matches(dropTargetSelector) || el instanceof SVGSVGElement);
        for (const dropTarget of dropTargets) {
            dropTarget.dispatchEvent(
                new BkpDragEvent({
                    eventType: BKP_DROP,
                    startPos: dragInfo.startPos,
                    curPos: endPos,
                    dropController: dragInfo.dropController,
                }));
            // Children of <svg> elements won't be returned by elementsFromPoint
            // (only the top-level <svg> will be) and so we have to recurse
            // manually.
            if (dropTarget instanceof SVGSVGElement) {
                const innerDropTargets =
                    dropTarget.querySelectorAll(dropTargetSelector);
                for (const innerDropTarget of innerDropTargets) {
                    const containsDropPoint =
                        boxContainsPoint(
                            innerDropTarget.getBoundingClientRect(),
                            endPos);
                    if (!containsDropPoint) {
                        continue;
                    }

                    innerDropTarget.dispatchEvent(
                        new BkpDragEvent({
                            eventType: BKP_DROP,
                            startPos: dragInfo.startPos,
                            curPos: endPos,
                            dropController: dragInfo.dropController,
                        }));
                }
            }
        }
        dragInfo.el.dispatchEvent(
            new BkpDragEvent({
                eventType: BKP_DRAG_END,
                startPos: dragInfo.startPos,
                curPos: endPos,
            }));
    }
}

function initGlobalMouseListeners() {
    const mouseDownListener = (e: MouseEvent) => {
        const targetEl = e.target as HTMLElement;
        const dragStarted = ddService.startDrag(
            MOUSE_TOUCH_ID,
            targetEl,
            { x: e.clientX, y: e.clientY });

        if (dragStarted) {
            // Don't add mousemove listener until we need it, so that we're not
            // sending lots of unnecessary mousemove events outside of drag-n-drop
            // sequences.
            document.body.addEventListener('mousemove', mouseMoveListener);
            document.body.addEventListener('mouseup', mouseUpListener);
        }
    };

    const mouseMoveListener = (e: MouseEvent) => {
        // We may not see a mouseup event if the user drags something outside
        // of the browser viewport, and un-presses the mouse button before
        // coming back to the viewport. This check causes the drag operation to
        // end as soon as we become aware of this situation.
        if (e.buttons == 0) {
            return mouseUpListener(e);
        }
        ddService.moveDrag(MOUSE_TOUCH_ID, { x: e.clientX, y: e.clientY });
    };

    const mouseUpListener = (e: MouseEvent) => {
        document.body.removeEventListener('mousemove', mouseMoveListener);
        document.body.removeEventListener('mouseup', mouseUpListener);
        ddService.endDrag(MOUSE_TOUCH_ID, { x: e.clientX, y: e.clientY });
    };

    // Don't add mousemove listener until we need it, so that we're not
    // sending lots of unnecessary mousemove events outside of drag-n-drop
    // sequences.
    document.body.addEventListener('mousedown', mouseDownListener);
}

function initGlobalTouchListeners() {
    const dragTouches = new Set<number>();

    const touchStartListener = (e: TouchEvent) => {
        for (const touch of e.changedTouches) {
            const dragStarted = ddService.startDrag(
                touch.identifier,
                touch.target as HTMLElement,
                { x: touch.clientX, y: touch.clientY });
            if (dragStarted) {
                dragTouches.add(touch.identifier);
            }
        }
    };

    const touchMoveListener = (e: TouchEvent) => {
        for (const touch of e.changedTouches) {
            if (!dragTouches.has(touch.identifier)) {
                continue;
            }
            ddService.moveDrag(
                touch.identifier,
                { x: touch.clientX, y: touch.clientY });
        }
    };

    const touchEndListener = (e: TouchEvent) => {
        for (const touch of e.changedTouches) {
            if (!dragTouches.has(touch.identifier)) {
                continue;
            }
            ddService.endDrag(
                touch.identifier,
                { x: touch.clientX, y: touch.clientY });
            dragTouches.delete(touch.identifier);
        }
    };

    // OK to register all events always, because 
    document.body.addEventListener('touchstart', touchStartListener);
    document.body.addEventListener('touchmove', touchMoveListener);
    document.body.addEventListener('touchend', touchEndListener);
}

// A fake "touch ID" for mouse events. Since there can only be one mouse-drag at
// a time (compare to touch events where you can drag multiple things at a time)
// it doesn't matter what the ID is, so long as it doesn't conflict with the
// values used by touch.identifier [1]
// [1] https://developer.mozilla.org/en-US/docs/Web/API/Touch/identifier
const MOUSE_TOUCH_ID = -12345;
export const BKP_DRAGGABLE_ATTR = 'bkp-draggable';
export const BKP_DROP_TARGET_ATTR = 'bkp-drop-target';
const ddService = new DragDropService();
