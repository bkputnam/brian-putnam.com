// This type just helps clarify what sort of a number we expect to be inside the
// BigInt (an unsigned int64). It doesn't provide any additional type safety.
type u64 = bigint;

async function hashU64(val: u64, maxVal: u64): Promise<u64> {
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

async function hashNum(val: number, maxVal: number): Promise<number> {
    return Number(await hashU64(BigInt(val), BigInt(maxVal)));
}

const SOLUTIONS_LENGTH = 310;
const MAX_I = 1000;

async function main() {
    const hits = new Array(SOLUTIONS_LENGTH);
    hits.fill(false);

    const promises: Array<Promise<unknown>> = [];
    for (let i = 0; i < MAX_I; i++) {
        promises.push(hashNum(i, SOLUTIONS_LENGTH).then((hash) => {
            hits[hash] = true;
        }));
    }
    await Promise.all(promises);

    console.log(hits);
}
main();