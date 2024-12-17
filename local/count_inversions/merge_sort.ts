export function mergeSort(arr: number[]): number {
    return mergeSortHelper([...arr]);
}

function mergeSortHelper(arr: number[]): number {
    if (arr.length <= 1) {
        return 0;
    }
    const midpoint = Math.round(arr.length / 2);
    const firstHalf = arr.slice(0, midpoint);
    const secondHalf = arr.slice(midpoint, arr.length);
    const leftInversions = mergeSortHelper(firstHalf);
    const rightInversions = mergeSortHelper(secondHalf);
    let firstHalfIndex = 0;
    const firstHalfEnd = firstHalf.length;
    let secondHalfIndex = 0;
    const secondHalfEnd = secondHalf.length;
    let crossInversions = 0;
    for (let i = 0; i < arr.length; i++) {
        const useFirstHalf = (() => {
            if (firstHalfIndex >= firstHalfEnd) {
                return false;
            }
            if (secondHalfIndex >= secondHalfEnd) {
                return true;
            }
            const useFirstHalf =
                firstHalf[firstHalfIndex] <= secondHalf[secondHalfIndex];
            if (!useFirstHalf) {
                crossInversions += firstHalfEnd - firstHalfIndex;
            }
            return useFirstHalf;
        })();
        if (useFirstHalf) {
            arr[i] = firstHalf[firstHalfIndex];
            firstHalfIndex++;
        } else {
            arr[i] = secondHalf[secondHalfIndex];
            secondHalfIndex++;
        }
    }

    return leftInversions + rightInversions + crossInversions;
}
