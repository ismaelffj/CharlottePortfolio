import { describe, expect, it } from 'vitest';
import { pieceBaseSchema } from '../lib/schemas';
import { normalizePiece } from '../lib/pieces';
import { gridColumns, gridImage, tileKinds } from '../lib/tiles';

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

describe('gridColumns', () => {
  it('uses the chosen count on desktop, at most three on tablets and two on phones', () => {
    expect(gridColumns(4)).toEqual({ desktop: 4, tablet: 3, phone: 2 });
    expect(gridColumns(6)).toEqual({ desktop: 6, tablet: 3, phone: 2 });
  });

  it('keeps two across everywhere for a two-column grid', () => {
    expect(gridColumns(2)).toEqual({ desktop: 2, tablet: 2, phone: 2 });
  });
});

describe('gridImage', () => {
  it('sizes a four-across square at 230px on desktop, with candidates for small squares and 2x screens', () => {
    expect(gridImage(4)).toEqual({
      width: 230,
      widths: [230, 320, 640],
      sizes: '(max-width: 639px) calc(50vw - 28px), (max-width: 1023px) calc(33vw - 40px), 230px',
    });
  });

  it('serves a two-across square at nearly half the measure, two across on tablets too', () => {
    expect(gridImage(2)).toEqual({
      width: 484,
      widths: [320, 484, 968],
      sizes: '(max-width: 639px) calc(50vw - 28px), (max-width: 1023px) calc(50vw - 50px), 484px',
    });
  });

  it('keeps candidates big enough for phones when the desktop square is small', () => {
    expect(gridImage(6)).toEqual({
      width: 146,
      widths: [146, 320, 640],
      sizes: '(max-width: 639px) calc(50vw - 28px), (max-width: 1023px) calc(33vw - 40px), 146px',
    });
  });
});
