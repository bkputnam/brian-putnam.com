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

export interface CssCoord {
    top: number;
    left: number;
}

export interface CssTransformCoords {
    translateX: number;
    translateY: number;
}
