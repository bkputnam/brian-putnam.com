import { bruteForce } from "./brute_force.js";
import { mergeSort } from "./merge_sort.js";


function randTest(): number[] {
    const arrLen = Math.round(Math.random() * 10000);
    const arr = new Array(arrLen);
    for (let i = 0; i < arrLen; i++) {
        arr[i] = Math.round(Math.random() * 100);
    }
    return arr;
}

const tests = [
    [ 89, 1, 27, 67 ],
    [ 89, 65, 83, 30 ]
];

let index = 0;
while (true) {
    const arr = tests.length > 0 ? tests.shift()! : randTest();

    const expected = bruteForce([...arr]);
    const actual = mergeSort([...arr]);

    if (expected !== actual) {
        console.log(arr);
        console.log(expected);
        console.log(actual);
        break;
    } else {
        console.log(`${index}: SUCCESS ${expected} === ${actual}`);
    }
    index++;
}

