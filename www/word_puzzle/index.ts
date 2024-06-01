// Make sure that dragDropService initializes itself
import './bkp_drag_drop/drag_drop_service.js';

import { SOLUTIONS } from './data/solutions.js';
import { pick1 } from './util/random.js';
import { Solution } from './data_structures/solution.js';
import { PlayAreaController } from './render/play_area_controller.js';

const solutionText = pick1(SOLUTIONS);
console.log(solutionText);
const solution = new Solution(solutionText);

const playAreaController = new PlayAreaController(solution);
document.body.appendChild(playAreaController.render());
