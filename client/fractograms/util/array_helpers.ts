export function sum(numbers: number[]): number {
    return numbers.reduce(
        (currentSum: number, val: number) => currentSum + val,
        0
    );
}