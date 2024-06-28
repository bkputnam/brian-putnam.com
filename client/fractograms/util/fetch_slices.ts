import { u64 } from "./deserializer.js";

// According to fractogram_slicer, this is the number of possible slices of a
// 5x5 grid.
export const MAX_SLICE_INDEX = 778363;

// Values are unsigned int64
const BYTES_PER_VALUE = 8;

// See: MAX_HASHES_PER_FILE in hash_writer.rs
const MAX_HASHES_PER_FILE = (1024 * 3) / BYTES_PER_VALUE;

export async function fetchSliceHash(sliceIndex: number): Promise<u64> {
    if (sliceIndex >= MAX_SLICE_INDEX) {
        throw new Error(`Slice index out of bounds: ${sliceIndex}`);
    }
    const fileIndex = Math.floor(sliceIndex / MAX_HASHES_PER_FILE);
    const valueIndex = sliceIndex % MAX_HASHES_PER_FILE;

    const fileName = String(fileIndex).padStart(6, '0');
    const response = await fetch(`data/slices/${fileName}.slice`);
    const buf = await response.arrayBuffer();
    const dataView = new DataView(buf);
    return dataView.getBigUint64(valueIndex * BYTES_PER_VALUE);
}
