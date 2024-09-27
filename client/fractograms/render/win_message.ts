import { PieceAtCoord } from "../data_structures/piece.js";
import { deserializeHintStats, SolutionStats } from "../data_structures/solution_stats.js";
import { sum } from "../util/array_helpers.js";
import { msToHumanReadable } from "../util/time.js";
import { Controller } from "./controller.js";

export class WinMessage extends Controller<HTMLElement> {
    constructor(private readonly solutionStats: SolutionStats) {
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
        const firstLine = this.solutionStats.gameType == 'daily'
            ? `I beat today's Fractogram!`
            : `I beat this Fractogram:`;
        const elapsedTimeStr =
            msToHumanReadable(this.solutionStats.elapsedMs);
        const hintStats = deserializeHintStats(this.solutionStats.hints);
        const numHints = hintStats.hints.length;
        const numCells = sum(
            hintStats.hints.map(
                (hint: PieceAtCoord) => hint.piece.countLetters()));
        const hintStr =
            numHints == 0 ? 'Zero hints' :
                numHints == 1 ? `1 hint (${numCells} cells)` :
                    `${numHints} hints (${numCells} cells)`;
        return [
            firstLine,
            location.href,
            elapsedTimeStr + ', ' + hintStr,
        ];
    }
}