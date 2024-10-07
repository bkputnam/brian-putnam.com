import { InitResult, initUniverse } from "./init_universe.js";
import { getRed, setRgb } from "./util/imagedata_util.js";
import { InitOutput, Universe } from "./wasm/nbody_wasm.js";

class NBodySimulation {
    private readonly wasm: InitOutput;
    private readonly universe: Universe;
    private readonly canvas: HTMLCanvasElement;
    private readonly ctx: CanvasRenderingContext2D;

    private constructor(initObj: InitResult) {
        const { wasm, universe } = initObj;
        this.wasm = wasm;
        this.universe = universe;
        this.canvas = document.createElement('canvas');
        this.canvas.width = document.body.clientWidth;
        this.canvas.height = document.body.clientHeight;
        document.body.appendChild(this.canvas);
        this.ctx = this.canvas.getContext("2d")!;
    }

    static async init(): Promise<NBodySimulation> {
        const result = new NBodySimulation(await initUniverse());
        requestAnimationFrame(() => result.drawLoop());
        return result;
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

    private draw() {
        const num_bodies = this.universe.get_num_bodies();
        const { wasm, universe, ctx, canvas } = this;

        // Not sure why we have to recreate these every time. In previous versions
        // of the code initializing these once, outside this function, worked just
        // fine. However with commit 1be55af I started getting error messages about
        // "attempting to access detached ArrayBuffer". I tracked it down to the
        // line in QuadTree::new where we allocate the `nodes` array using
        // `Vec::with_capacity`. I don't understand what that does to the
        // `positions` and `masses` arrays, but if I comment it out I don't get the
        // "detached ArrayBuffer" messages, and if I uncomment it I have to
        // re-initialize these Float64Arrays on every draw() call as a workaround.
        const positions = new Float64Array(
            wasm.memory.buffer,
            universe.get_positions(),
            num_bodies * 2);
        const masses = new Float64Array(
            wasm.memory.buffer, universe.get_masses(), num_bodies);

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        ctx.fillStyle = "#000";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        let imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        for (let i = 0; i < num_bodies; i++) {
            const x = this.xToCanvasCoords(positions[i * 2]);
            const y = this.yToCanvasCoords(positions[i * 2 + 1]);
            if (this.isInBounds(x, y)) {
                let red = getRed(imageData, x, y);
                red = Math.round(255 - (255 - red) * 0.5);
                setRgb(imageData, x, y, red, red, red);
            }
        }
        ctx.putImageData(imageData, 0, 0);
    }

    private drawLoop() {
        this.draw();
        this.universe.step_n(1);
        requestAnimationFrame(() => this.drawLoop());
    }
}
NBodySimulation.init();

