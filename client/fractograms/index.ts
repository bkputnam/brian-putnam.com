// Make sure that dragDropService initializes itself
import './bkp_drag_drop/drag_drop_service.js';

import { msToHumanReadable } from './util/time.js';
import { globalGameState } from './data_structures/game.js';
import { PageController } from './render/page_controller.js';
import { WinDialog } from './render/win_dialog.js';


const pageController = new PageController(
    /* parent= */ document.getElementById('play-area')!,
    /* onWinCallback= */() => {
        hintBtn.disabled = true;
        // Use setTimeout to give the page a moment to render the final move
        setTimeout(
            async () => {
                const winDialog = new WinDialog();
                winDialog.render();
                await winDialog.showModal();
                pageController.clearAndRender('random');
                hintBtn.disabled = false;
            },
            50);
    },
);
globalGameState.pageController = pageController;
pageController.clearAndRender('daily');

const hintBtn = document.getElementById('hint-btn') as HTMLButtonElement;
hintBtn.addEventListener('click', (e: MouseEvent) => {
    // Prevent page refresh, since this lives in a <form>
    e.preventDefault();
    if (!pageController.isComplete()) {
        pageController.applyHint();
    }
});

const timerEl = document.getElementById('timer')!;
const updateTimer = () => {
    const elapsed = pageController.getTimer().getElapsedMs();
    const elapsedStr = msToHumanReadable(elapsed);
    timerEl.innerText = elapsedStr;
    requestAnimationFrame(updateTimer);
}
updateTimer();

document.addEventListener('visibilitychange', (e: FocusEvent) => {
    if (pageController.isComplete()) {
        return;
    }
    if (document.visibilityState === 'hidden') {
        pageController.getTimer().pause();
    } else {
        pageController.getTimer().start();
    }
});
