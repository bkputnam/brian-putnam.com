import { CssTransformCoords } from "../data_structures/coords.ts";

export function getTranslateXY(
  element: SVGGraphicsElement
): CssTransformCoords {
  // https://stackoverflow.com/questions/46434687/get-the-current-matrix-transformation-of-an-svg-element#answer-46448918
  const matrix = element.transform.baseVal.consolidate()?.matrix;

  if (!matrix) {
    // Not sure why matrix could be null, my best guess is that it means
    // there are no transforms applied and so this would be the correct
    // return val.
    return { translateX: 0, translateY: 0 };
  }

  // https://stackoverflow.com/questions/8851023/how-to-get-the-actual-x-y-position-of-an-element-in-svg-with-transformations-and#answer-9190682
  return {
    translateX: matrix.e,
    translateY: matrix.f,
  };
}
