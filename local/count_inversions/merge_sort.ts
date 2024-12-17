export function mergeSort(arr: number[]) {
    const arrCopy = [...arr];
    mergeSortHelper(arrCopy);
    console.log(arrCopy);
    return arrCopy;
}

function mergeSortHelper(arr: number[]) {
    if (arr.length <= 1) {
        return;
    }
    const midpoint = Math.round(arr.length / 2);
    const firstHalf = arr.slice(0, midpoint);
    const secondHalf = arr.slice(midpoint, arr.length);
    mergeSortHelper(firstHalf);
    mergeSortHelper(secondHalf);
    let firstHalfIndex = 0;
    const firstHalfEnd = midpoint;
    let secondHalfIndex = midpoint;
    const secondHalfEnd = arr.length;
    for (let i = 0; i < arr.length; i++) {
        const useFirstHalf = (() => {
            if (firstHalfIndex >= firstHalfEnd) {
                return false;
            }
            if (secondHalfIndex >= secondHalfEnd) {
                return true;
            }
            return firstHalf[firstHalfIndex] <= secondHalf[secondHalfIndex];
        })();
        if (useFirstHalf) {
            arr[i] = firstHalf[firstHalfIndex];
            firstHalfIndex++;
        } else {
            arr[i] = secondHalf[secondHalfIndex];
            secondHalfIndex++;
        }
    }
}


// export function mergeSort(arr: number[]): number {
//     const inputSlice = new Slice([...arr], 0, arr.length);
//     const outputArr = new Array(arr.length);
//     const outputSlice = new Slice(outputArr, 0, arr.length);
//     const result = mergeSortHelper(inputSlice, outputSlice);
//     console.log(outputArr);
//     return result;
// }

// class Slice {
//     constructor(
//         private readonly arr: number[],
//         readonly startIndex: number,
//         readonly endIndex: number
//     ) {}

//     get(index: number): number {
//         const trueIndex = this.startIndex + index;
//         if (trueIndex >= this.endIndex) {
//             throw new Error(
//                 `Index out of bounds: ${trueIndex} >= ${this.endIndex}`);
//         }
//         return this.arr[trueIndex];
//     }

//     set(index: number, value: number) {
//         const trueIndex = this.startIndex + index;
//         if (trueIndex >= this.endIndex) {
//             throw new Error(
//                 `Index out of bounds: ${trueIndex} >= ${this.endIndex}`);
//         }
//         this.arr[trueIndex] = value;
//     }

//     length(): number {
//         return this.endIndex - this.startIndex;
//     }

//     halve(): [Slice, Slice] {
//         const midpoint = (this.startIndex + this.endIndex) / 2;
//         return [
//             new Slice(this.arr, this.startIndex, midpoint),
//             new Slice(this.arr, midpoint, this.endIndex),
//         ];
//     }
// }

// function mergeSortHelper(inputSlice: Slice, outputSlice: Slice): number {
//     const len = inputSlice.length();
//     if (len <= 1) {
//         return 0;
//     }
//     const [firstHalf, secondHalf] = inputSlice.halve();
//     const [outputFirst, outputSecond] = outputSlice.halve();
//     mergeSortHelper(firstHalf, outputFirst);
//     mergeSortHelper(secondHalf, outputSecond);
//     let outputIndex = 0;
//     let firstHalfIndex = 0;
//     const firstHalfEnd = firstHalf.length();
//     let secondHalfIndex = 0;
//     const secondHalfEnd = secondHalf.length();
//     while (outputIndex < len) {
//         const useFirstHalf = (() => {
//             if (firstHalfIndex >= firstHalfEnd) {
//                 return false;
//             }
//             if (secondHalfIndex >= secondHalfEnd) {
//                 return true;
//             }
//             return (
//                 firstHalf.get(firstHalfIndex) < secondHalf.get(secondHalfIndex)
//             );
//         })();
//         if (useFirstHalf) {
//             outputSlice.set(outputIndex, firstHalf.get(firstHalfIndex));
//             firstHalfIndex++;
//         } else {
//             outputSlice.set(outputIndex, secondHalf.get(secondHalfIndex));
//             secondHalfIndex++;
//         }
//         outputIndex++;
//     }

//     return 5;
// }