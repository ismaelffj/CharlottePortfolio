import type { Piece } from './pieces';

export type TileKind = 'image' | 'paper' | 'rose' | 'green';

/**
 * One tile kind per piece, in order. Plain tiles (no image, no opening lines)
 * alternate rose and green by their order among plain tiles within the list,
 * which is one category section on the home page.
 */
export function tileKinds(pieces: Piece[]): TileKind[] {
  let plain = 0;
  return pieces.map((piece) => {
    if (piece.image) return 'image';
    if (piece.openingLines.trim()) return 'paper';
    return plain++ % 2 === 0 ? 'rose' : 'green';
  });
}

export interface GridColumns {
  desktop: number;
  tablet: number;
  phone: number;
}

const MAX_TABLET_COLUMNS = 3;
const MAX_PHONE_COLUMNS = 2;

/** The chosen count on desktop; tablets and phones cap it so squares never get too small. */
export function gridColumns(perRow: number): GridColumns {
  return { desktop: perRow, tablet: Math.min(perRow, MAX_TABLET_COLUMNS), phone: Math.min(perRow, MAX_PHONE_COLUMNS) };
}

export interface ImageSpec {
  width: number;
  widths: number[];
  sizes: string;
}

// The measure and the grid gap from the theme, so a square's served width follows its column count.
const CONTENT_WIDTH = 992;
const GRID_GAP = 24;
// One candidate covers any square on a phone (two across) or a three-across tablet, whatever the desktop count.
const SMALL_SQUARE = 320;
const PHONE_SIZE = 'calc(50vw - 28px)';
const TABLET_SIZE: Record<number, string> = { 2: 'calc(50vw - 50px)', 3: 'calc(33vw - 40px)' };

/** The featured square is 160px, or 112px on phones. */
export const FEATURED_IMAGE: ImageSpec = { width: 160, widths: [160, 320], sizes: '(max-width: 639px) 112px, 160px' };

/** The square at the start of a row is 56px, or 48px on phones. */
export const THUMBNAIL_IMAGE: ImageSpec = { width: 56, widths: [56, 112], sizes: '(max-width: 639px) 48px, 56px' };

/** Image widths and the `sizes` hint for a grid square, given how many sit across on desktop. */
export function gridImage(perRow: number): ImageSpec {
  const columns = gridColumns(perRow);
  const width = Math.ceil((CONTENT_WIDTH - GRID_GAP * (columns.desktop - 1)) / columns.desktop);
  const widths = [...new Set([width, SMALL_SQUARE, 2 * Math.max(width, SMALL_SQUARE)])].sort((a, b) => a - b);
  return {
    width,
    widths,
    sizes: `(max-width: 639px) ${PHONE_SIZE}, (max-width: 1023px) ${TABLET_SIZE[columns.tablet]}, ${width}px`,
  };
}
