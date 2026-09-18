import { describe, expect, it } from 'vitest';
import { pieceBaseSchema } from '../lib/schemas';
import { normalizePiece } from '../lib/pieces';
import { tileKinds } from '../lib/tiles';

const fakeImage = { src: '/img.jpg', width: 1200, height: 1200, format: 'jpg' } as const;

const piece = (slug: string, overrides: Record<string, unknown> = {}, image: typeof fakeImage | null = null) =>
  normalizePiece(slug, { ...pieceBaseSchema.parse({ title: slug, published: true, ...overrides }), image });

describe('tileKinds', () => {
  it('prefers the image, then the paper tile, then alternating plain tiles', () => {
    const kinds = tileKinds([
      piece('with-image', {}, fakeImage),
      piece('with-lines', { openingLines: 'The county keeps its records.' }),
      piece('plain-1'),
      piece('plain-2'),
      piece('with-lines-2', { openingLines: 'More lines.' }),
      piece('plain-3'),
    ]);
    expect(kinds).toEqual(['image', 'paper', 'rose', 'green', 'paper', 'rose']);
  });

  it('treats whitespace-only opening lines as none', () => {
    expect(tileKinds([piece('a', { openingLines: '   \n' })])).toEqual(['rose']);
  });

  it('returns an empty list for no pieces', () => {
    expect(tileKinds([])).toEqual([]);
  });
});
