import { ScreenCoord } from "../data_structures/coord.js";
import { BKP_DRAG, BKP_DRAG_END, BKP_DRAG_START, BKP_DROP, BkpDragEvent } from "./events.js";

interface DragDropServiceApi {
}

interface DragInfo {
    identifier: number;
    el: HTMLElement;
    startPos: ScreenCoord;
}

class DragDropService implements DragDropServiceApi {
    private readonly claimedEls = new Set<HTMLElement>();
    private readonly drags = new Map<number, DragInfo>();

    constructor() {
        initGlobalMouseListeners();
        initGlobalTouchListeners();
    }

    startDrag(id: number, targetEl: HTMLElement, startPos: ScreenCoord) {
        const el =
            targetEl.closest(`[${BKP_DRAGGABLE_ATTR}="true"]`) as HTMLElement;
        if (!el) {
            console.warn(
                `[BKP] Attempting to start drag on Element without ` +
                `[${BKP_DRAGGABLE_ATTR}="true"]`);
            return;
        }
        if (this.claimedEls.has(el)) {
            console.warn(
                `[BKP] Attempting to drag an Element already being dragged`,
                el);
            return;
        }
        this.claimedEls.add(el);
        this.drags.set(id, {
            identifier: id,
            el,
            startPos,
        });
        el.dispatchEvent(new BkpDragEvent({
            eventType: BKP_DRAG_START,
            startPos,
            curPos: startPos,
        }));
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

        const dropTargets = document.elementsFromPoint(endPos.x, endPos.y)
            .filter((el: Element) => !dragInfo.el.contains(el));
        for (const dropTarget of dropTargets) {
            dropTarget.dispatchEvent(
                new BkpDragEvent({
                    eventType: BKP_DROP,
                    startPos: dragInfo.startPos,
                    curPos: endPos,
                }));
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
        const draggableEl = targetEl.closest(`[${BKP_DRAGGABLE_ATTR}="true"]`);
        if (!draggableEl) {
            return;
        }
        ddService.startDrag(
            MOUSE_TOUCH_ID,
            targetEl,
            { x: e.clientX, y: e.clientY });

        document.body.addEventListener('mousemove', mouseMoveListener);
    };

    const mouseMoveListener = (e: MouseEvent) => {
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

    document.body.addEventListener('mousedown', mouseDownListener);
}

function initGlobalTouchListeners() {
    // TODO
}

// A fake "touch ID" for mouse events. Since there can only be one mouse-drag at
// a time (compare to touch events where you can drag multiple things at a time)
// it doesn't matter what the ID is, so long as it doesn't conflict with the
// values used by touch.identifier [1]
// [1] https://developer.mozilla.org/en-US/docs/Web/API/Touch/identifier
const MOUSE_TOUCH_ID = -12345;
export const BKP_DRAGGABLE_ATTR = 'bkp-draggable';
const ddService = new DragDropService();
export const dragDropService: DragDropServiceApi = ddService;
