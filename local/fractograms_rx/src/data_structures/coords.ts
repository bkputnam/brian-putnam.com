export interface RowCol {
  row: number;
  col: number;
}

export interface LetterCoord {
  letter: string;
  coord: RowCol;
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

export function toTranslateStr(coords: CssTransformCoords): string {
  return `translate(${coords.translateX} ${coords.translateY})`;
}
