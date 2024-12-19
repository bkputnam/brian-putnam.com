// Make sure that dragDropService initializes itself
import "./bkp_drag_drop/drag_drop_service.js";

import { msToHumanReadable } from "./util/time.js";
import { globalGameState } from "./data_structures/game.js";
import { PageController } from "./render/page_controller.js";
import {
  getRandomSolutionIndices,
  getSolutionIndices,
} from "./util/solutions.js";
import { Solution } from "./data_structures/solution.js";

const pageController = new PageController(
  /* parent= */ document.getElementById("play-area")!,
  /* onWinCallback= */ () => {
    hintBtn.disabled = true;
    // Use setTimeout to give the page a moment to render the final move
    setTimeout(async () => {
      pageController.displayWinMessage();
    }, 50);
  }
);
globalGameState.pageController = pageController;
getSolutionIndices("daily", location.hash).then(async (solutionIndices) => {
  await pageController.clearAndRender(solutionIndices);
  const loadTimeMs = performance.now() - (window as any).__PAGE_LOAD_START;
  const loadTimeSec = (loadTimeMs / 1000).toFixed(2);
  console.log(`Page load: ${loadTimeSec} sec`);
});

const hintBtn = document.getElementById("hint-btn") as HTMLButtonElement;
hintBtn.addEventListener("click", (e: MouseEvent) => {
  // Prevent page refresh, since this lives in a <form>
  e.preventDefault();
  if (!pageController.isComplete()) {
    pageController.applyHint();
  }
});

const randBtn = document.getElementById("random-btn") as HTMLButtonElement;
randBtn.addEventListener("click", (e: MouseEvent) => {
  // Prevent page refresh, since this lives in a <form>
  e.preventDefault();
  pageController.clearAndRender(getRandomSolutionIndices());
  hintBtn.disabled = false;
});

const timerEl = document.getElementById("timer")!;
const updateTimer = () => {
  const elapsed = pageController.getTimer().getElapsedMs();
  const elapsedStr = msToHumanReadable(elapsed);
  timerEl.innerText = elapsedStr;
  requestAnimationFrame(updateTimer);
};
updateTimer();

document.addEventListener("visibilitychange", (e: FocusEvent) => {
  if (pageController.isComplete()) {
    return;
  }
  if (document.visibilityState === "hidden") {
    pageController.getTimer().pause();
  } else {
    pageController.getTimer().start();
  }
});
