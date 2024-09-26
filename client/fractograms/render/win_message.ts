import { globalGameState } from "../data_structures/game.js";
import { msToHumanReadable } from "../util/time.js";
import { Controller } from "./controller.js";

export class WinMessage extends Controller<HTMLElement> {
    constructor() {
        super();
    }

    protected override createEl(): HTMLElement {
        const el = document.createElement('div');
        el.classList.add('win-message');
        return el;
    }

    protected override decorate(el: HTMLElement): void {
        const title = document.createElement('h2');
        title.innerText = 'You Win!';
        el.appendChild(title);

        const paragraph = document.createElement('p');
        let isFirst = true;
        for (const line of this.winStats()) {
            if (isFirst) {
                isFirst = false;
            } else {
                paragraph.appendChild(document.createElement('br'));
            }
            let el: HTMLElement;
            if (line.match(/^https?:\/\//)) {
                const a = document.createElement('a');
                a.href = line;
                el = a;
            } else {
                el = document.createElement('span');
            }
            el.innerText = line;
            paragraph.appendChild(el);
        }
        el.appendChild(paragraph);

        const shareBtn = document.createElement('button');
        shareBtn.classList.add('share');
        shareBtn.innerText = 'Share';
        shareBtn.addEventListener('click', async () => {
            await navigator.clipboard.writeText(this.winStats().join('\n'));
            alert('Copied to clipboard');
        });
        el.appendChild(shareBtn);
    }

    private winStats(): string[] {
        const pageController = globalGameState.pageController!;
        const firstLine = pageController.getGameType() == 'daily'
            ? `I beat today's Fractogram!`
            : `I beat this Fractogram:`;
        const elapsedTimeStr =
            msToHumanReadable(pageController.getTimer().getElapsedMs());
        const hintStats = pageController.getHintStats();
        const hintStr =
            hintStats.numHints == 0 ? 'Zero hints' :
                hintStats.numHints == 1 ? `1 hint (${hintStats.numCells} cells)` :
                    `${hintStats.numHints} hints (${hintStats.numCells} cells)`;
        return [
            firstLine,
            location.href,
            elapsedTimeStr + ', ' + hintStr,
        ];
    }
}