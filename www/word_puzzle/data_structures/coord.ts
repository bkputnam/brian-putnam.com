export interface BoardCoord {
    row: number;
    col: number;
}

export interface LetterCoord {
    letter: string,
    coord: BoardCoord,
}

export interface ScreenCoord {
    x: number;
    y: number;
}
