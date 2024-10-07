function getRedIndex(imageData: ImageData, x: number, y: number): number {
    return y * (imageData.width * 4) + x * 4;
}

export function getColors(
    imageData: ImageData,
    x: number,
    y: number,
): [number, number, number, number] {
    const ri = getRedIndex(imageData, x, y);
    return [
        imageData.data[ri],
        imageData.data[ri + 1],
        imageData.data[ri + 2],
        imageData.data[ri + 3]
    ];
};

export function getRed(
    imageData: ImageData,
    x: number,
    y: number,
): number {
    return imageData.data[getRedIndex(imageData, x, y)];
};

export function setRgb(
    imageData: ImageData,
    x: number,
    y: number,
    red: number,
    green: number,
    blue: number,
) {
    const ri = getRedIndex(imageData, x, y);
    imageData.data[ri] = red;
    imageData.data[ri + 1] = green;
    imageData.data[ri + 2] = blue;
};