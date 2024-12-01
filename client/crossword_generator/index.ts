import { PageController } from "./controllers/page_controller.js";

const pageController = new PageController();
document.body.appendChild(await pageController.render());
