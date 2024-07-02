import { globalGameState } from "../data_structures/game.js";
import { msToHumanReadable } from "../util/time.js";
import { Dialog } from "./dialog.js";

export class WinDialog extends Dialog {
    constructor() {
        super();
    }

    protected override getTitle(): string {
        return "You Win!";
    }

    protected override renderHtmlContent(): HTMLElement {
        const result = document.createElement('div');

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
        result.appendChild(paragraph);

        const shareBtn = document.createElement('button');
        shareBtn.classList.add('share');
        shareBtn.innerText = 'Share';
        shareBtn.addEventListener('click', async () => {
            await navigator.clipboard.writeText(this.winStats().join('\n'));
            alert('Copied to clipboard');
        });
        result.appendChild(shareBtn);

        return result;
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
            elapsedTimeStr,
            hintStr,
        ];
    }
}