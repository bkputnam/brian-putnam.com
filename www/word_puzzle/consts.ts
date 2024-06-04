const bodyStyle = getComputedStyle(document.body);

export const CELL_WIDTH_PX =
    parseInt(bodyStyle.getPropertyValue('--letter-side-len'));
export const BORDER_WIDTH =
    parseInt(bodyStyle.getPropertyValue('--border-width'));

// This radius is used for computing SVG paths, not for CSS border-radius
// styles, and so we just define it here instead of reading it from CSS styles.
export const BORDER_RADIUS = 13;