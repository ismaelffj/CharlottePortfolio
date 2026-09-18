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
