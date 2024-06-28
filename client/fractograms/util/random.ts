import { u64 } from "./deserializer.js";

// https://stackoverflow.com/questions/2450954/how-to-randomize-shuffle-a-javascript-array
export function shuffleInPlace<T>(array: T[]): T[] {
    let currentIndex = array.length;
    let randomIndex: number;

    // While there remain elements to shuffle.
    while (currentIndex > 0) {
        // Pick a remaining element.
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;

        // And swap it with the current element.
        [array[currentIndex], array[randomIndex]] = [
            array[randomIndex], array[currentIndex]];
    }
    return array;
}

export function pick1<T>(arr: T[]): T {
    return arr[randInt(0, arr.length)];
}

export function randInt(low: number, high: number): number {
    if (low > high) {
        const temp = low;
        low = high;
        high = temp;
    }
    return Math.floor(Math.random() * (high - low) + low);
}

export async function hashU64(val: u64, maxVal: u64): Promise<u64> {
    const buf = new ArrayBuffer(8);
    const dataView = new DataView(buf);
    dataView.setBigUint64(0, val);
    const hashBuf = await window.crypto.subtle.digest('SHA-256', buf);
    const hashArray = Array.from(new Uint8Array(hashBuf));
    const hashHex = hashArray
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");
    const bigInt = BigInt('0x' + hashHex)
    return bigInt % maxVal;
}

export async function hashNum(val: number, maxVal: number): Promise<number> {
    return Number(await hashU64(BigInt(val), BigInt(maxVal)));
}
