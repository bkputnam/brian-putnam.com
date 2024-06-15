// Make sure that dragDropService initializes itself
import './bkp_drag_drop/drag_drop_service.js';

import { SOLUTIONS } from './data/solutions.js';
import { pick1 } from './util/random.js';
import { Solution } from './data_structures/solution.js';
import { PlayAreaController } from './render/play_area_controller.js';
import { Timer, msToHumanReadable } from './util/time.js';
import { Board } from './data_structures/board.js';
import { globalGameState } from './data_structures/game.js';

const solutionText = pick1(SOLUTIONS);
console.log(solutionText);
const solution = new Solution(solutionText);

const playAreaController = new PlayAreaController(solution);
document.body.appendChild(playAreaController.render());
playAreaController.renderPieces();
let isComplete = false;
playAreaController.onBoardComplete().then((board: Board) => {
    timer.stop();
    if (!isComplete) {
        isComplete = true;
        const winMsg = [
            'You win!',
            `Time: ${msToHumanReadable(timer.getElapsedMs())}`,
            `Hints: ${globalGameState.numHintCells} cells ` +
            `(${globalGameState.numHints} hints)`
        ].join('\n');
        hintBtn.disabled = true;
        // Use setTimeout to give the page a moment to render the final move
        setTimeout(
            () => alert(winMsg),
            50);
    }
});

const hintBtn = document.getElementById('hint-btn') as HTMLButtonElement;
hintBtn.addEventListener('click', (e: MouseEvent) => {
    // Prevent page refresh, since this lives in a <form>
    e.preventDefault();
    if (!isComplete) {
        playAreaController.applyHint();
    }
});

const timerEl = document.getElementById('timer')!;
const timer = Timer.newStarted();
const updateTimer = () => {
    const elapsed = timer.getElapsedMs();
    const elapsedStr = msToHumanReadable(elapsed);
    timerEl.innerText = elapsedStr;
    requestAnimationFrame(updateTimer);
}
updateTimer();

document.addEventListener('visibilitychange', (e: FocusEvent) => {
    if (isComplete) {
        return;
    }
    if (document.visibilityState === 'hidden') {
        timer.pause();
    } else {
        timer.start();
    }
});
