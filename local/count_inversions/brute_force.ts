export function bruteForce(arr: number[]): number {
    let count = 0;
    for (let i = 0; i < arr.length - 1; i++) {
        for (let j = i + 1; j < arr.length; j++) {
            if (arr[j] < arr[i]) {
                count++;
            }
        }
    }
    return count;
}