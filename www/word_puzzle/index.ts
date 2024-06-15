// Make sure that dragDropService initializes itself
import './bkp_drag_drop/drag_drop_service.js';

import { SOLUTIONS } from './data/solutions.js';
import { pick1 } from './util/random.js';
import { Solution } from './data_structures/solution.js';
import { PlayAreaController } from './render/play_area_controller.js';
import { Timer, msToHumanReadable } from './util/time.js';
import { Board } from './data_structures/board.js';

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
        alert("You win!");
    }
});

document.getElementById('hint-btn')
    ?.addEventListener('click', (e: MouseEvent) => {
        // Prevent page refresh, since this lives in a <form>
        e.preventDefault();
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
