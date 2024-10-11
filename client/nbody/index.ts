import { InitResult, initUniverse } from "./init_universe.js";
import { getRed, setRgb } from "./util/imagedata_util.js";
import { InitOutput, Universe } from "./wasm/nbody_wasm.js";

class NBodySimulation {
    private readonly canvas: HTMLCanvasElement;
    private readonly ctx: CanvasRenderingContext2D;

    private startMs: number;
    private curIndex = 0;

    private constructor(private readonly data: Array<Array<number>>) {
        this.canvas = document.createElement('canvas');
        this.canvas.width = document.body.clientWidth;
        this.canvas.height = document.body.clientHeight;
        document.body.appendChild(this.canvas);
        this.ctx = this.canvas.getContext("2d")!;

        this.startMs = performance.now();
    }

    static async init(): Promise<NBodySimulation> {
        try {
            const response = await fetch("./data.csv");
            if (!response.ok) {
                throw new Error(`Response status: ${response.status}`);
            }

            const responseText = await response.text();
            const lines = responseText.split('\n').filter((line) => line != "");
            let expectedLineLen = -1;
            const data = lines.map((line: string) => {
                const row =
                    line.split(',').map((cell: string) => parseFloat(cell));
                if (expectedLineLen === -1) {
                    expectedLineLen = row.length;
                } else if (row.length !== expectedLineLen) {
                    throw new Error(`Unexpected row length: ${row.length}`);
                }
                return row;
            });
            const result = new NBodySimulation(data);
            requestAnimationFrame(() => result.drawLoop());
            return result;
        } catch (error: unknown) {
            return Promise.reject(error);
        }
    }

    private xToCanvasCoords(x: number) {
        return Math.round(x / 2 + this.canvas.width / 2);
    }

    private yToCanvasCoords(y: number) {
        return Math.round(y / 2 + this.canvas.height / 2);
    }

    private isInBounds(x: number, y: number) {
        return (x >= 0 && x < this.canvas.width)
            && (y >= 0 && y < this.canvas.height);
    }

    private getPositions(): number[] {
        const elapsedMs = (performance.now() - this.startMs) / 1000;
        const distToActualElapsed =
            (i: number) => Math.abs(this.data[i][0] - elapsedMs);
        const curDistToElapsed = distToActualElapsed(this.curIndex);

        while (true) {
            if (this.curIndex == this.data.length - 1) {
                this.curIndex = 0;
                this.startMs = performance.now();
                break;
            }
            if (distToActualElapsed(this.curIndex + 1) > curDistToElapsed) {
                break;
            }
            this.curIndex++;
        }
        const curRow = this.data[this.curIndex];
        return curRow.filter((val, index) => {
            let indexWithinBody = (index - 1) % 5;
            return indexWithinBody === 0 || indexWithinBody === 1;
        });
    }

    private draw() {
        const { ctx, canvas } = this;

        const positions = this.getPositions();
        const num_bodies = (positions.length - 1) / 5;

        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        this.ctx.fillStyle = "#000";
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        let imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        for (let i = 0; i < num_bodies; i++) {
            const x = Math.round(this.xToCanvasCoords(positions[i * 2]));
            const y = Math.round(this.yToCanvasCoords(positions[i * 2 + 1]));
            if (this.isInBounds(x, y)) {
                // let red = getRed(imageData, x, y);
                // red = Math.round(255 - (255 - red) * 0.5);
                // setRgb(imageData, x, y, red, red, red);
                setRgb(imageData, x, y, 255, 255, 255);
            }
        }
        ctx.putImageData(imageData, 0, 0);
    }

    private drawLoop() {
        this.draw();
        // this.universe.step_n(1);
        requestAnimationFrame(() => this.drawLoop());
    }
}
NBodySimulation.init();

