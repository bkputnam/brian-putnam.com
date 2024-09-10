import { SOLUTIONS } from "../data/solutions.js";
import { MAX_SLICE_INDEX } from "./fetch_slices.js";

function bytesToEncode(numPossibilities: number): number {
    return Math.ceil(Math.log2(numPossibilities) / 8);
}

function nextMultipleOf4(num: number): number {
    return Math.ceil(num / 4) * 4;
}

const GAME_INDEX_SIZE_BYTES = bytesToEncode(SOLUTIONS.length);
const SLICE_INDEX_SIZE_BYTES = nextMultipleOf4(bytesToEncode(MAX_SLICE_INDEX));

// Dumb check to make sure the code stays in sync with these constants.
if (GAME_INDEX_SIZE_BYTES != 2 || SLICE_INDEX_SIZE_BYTES != 4) {
    throw new Error('toFragment/fromFragment need to be updated');
}

export function toFragment(indices: { solutionIndex: number, sliceIndex: number }): string {
    const { sliceIndex, solutionIndex } = indices;
    const arrayBuffer =
        new ArrayBuffer(SLICE_INDEX_SIZE_BYTES + GAME_INDEX_SIZE_BYTES);
    // Use DataView so that endianness is deterministic, not platform-dependant
    // (not sure if this is an actual problem, but just to be safe)
    const dataView = new DataView(arrayBuffer);
    dataView.setUint32(0, sliceIndex);
    dataView.setUint16(SLICE_INDEX_SIZE_BYTES, solutionIndex);
    return window.btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)))
        .replaceAll('=', '');
}

export function fromFragment(fragment: string): { solutionIndex: number, sliceIndex: number } {
    while (fragment.length % 4 !== 0) {
        fragment += '=';
    }
    const arrayBuffer =
        new ArrayBuffer(SLICE_INDEX_SIZE_BYTES + GAME_INDEX_SIZE_BYTES);
    const byteStr = window.atob(fragment);
    if (byteStr.length !== SLICE_INDEX_SIZE_BYTES + GAME_INDEX_SIZE_BYTES) {
        throw new Error('Invalid fragment length');
    }
    const byteArr = new Uint8Array(arrayBuffer);
    for (let i = 0; i < byteStr.length; i++) {
        byteArr[i] = byteStr.charCodeAt(i);
    }
    const dataView = new DataView(arrayBuffer);
    const sliceIndex = dataView.getUint32(0);
    const solutionIndex = dataView.getUint16(SLICE_INDEX_SIZE_BYTES);
    return { solutionIndex, sliceIndex };
}
