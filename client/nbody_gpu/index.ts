import { fail } from "./fail.js";

async function main() {
    const adapter = await navigator.gpu?.requestAdapter();
    const device = await adapter?.requestDevice();
    if (!device) {
        fail('fail-msg');
        return;
    }
}
main();
