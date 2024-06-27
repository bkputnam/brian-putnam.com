
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