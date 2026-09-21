import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  categorySchema,
  contactSchema,
  kindSchema,
  pieceBaseSchema,
  relativeImagePath,
  settingsSchema,
} from '../lib/schemas';

let warn: ReturnType<typeof vi.spyOn>;
beforeEach(() => {
  warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
});
afterEach(() => vi.restoreAllMocks());

describe('pieceBaseSchema', () => {
  it('fills every missing optional field with a safe fallback', () => {
    const piece = pieceBaseSchema.parse({ title: 'Only a title' });
    expect(piece.title).toBe('Only a title');
    expect(piece.kind).toEqual({ discriminant: 'prose', value: { outlet: { name: '', url: '' }, body: '' } });
    expect(piece.category).toBe('');
    expect(piece.published).toBe(false);
    expect(piece.featured).toBe(false);
    expect(piece.dek).toBe('');
    expect(piece.imageAlt).toBe('');
    expect(piece.openingLines).toBe('');
    expect(piece.editorsNote).toBe('');
    expect(piece.date).toBeInstanceOf(Date);
  });

  it('parses a date string as a UTC date', () => {
    const piece = pieceBaseSchema.parse({ title: 't', date: '2024-03-15' });
    expect(piece.date.toISOString()).toBe('2024-03-15T00:00:00.000Z');
  });

  it('falls back to today when the date is malformed, and says so', () => {
    const before = Date.now();
    const piece = pieceBaseSchema.parse({ title: 't', date: 'not a date' });
    expect(piece.date.getTime()).toBeGreaterThanOrEqual(before - 1000);
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('[content] date'));
  });

  it('treats a non-boolean published flag as unpublished, and says so', () => {
    expect(pieceBaseSchema.parse({ title: 't', published: 'yes' }).published).toBe(false);
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('[content] published'));
  });

  it('treats a missing published flag as unpublished without a warning', () => {
    expect(pieceBaseSchema.parse({ title: 't', kind: { discriminant: 'prose', value: { body: '' } }, date: '2024-03-15' }).published).toBe(false);
    expect(warn).not.toHaveBeenCalled();
  });

  it('treats a missing featured flag as not featured without a warning', () => {
    expect(pieceBaseSchema.parse({ title: 't', kind: { discriminant: 'prose', value: { body: '' } }, date: '2024-03-15' }).featured).toBe(false);
    expect(warn).not.toHaveBeenCalled();
  });

  it('keeps a featured flag that is on', () => {
    expect(pieceBaseSchema.parse({ title: 't', featured: true }).featured).toBe(true);
  });

  it('treats a non-boolean featured flag as not featured, and says so', () => {
    expect(pieceBaseSchema.parse({ title: 't', featured: 'yes' }).featured).toBe(false);
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('[content] featured'));
  });

  it('stays silent when optional fields are simply missing', () => {
    pieceBaseSchema.parse({ title: 'Only a title', kind: { discriminant: 'prose', value: { body: '' } }, date: '2024-03-15', published: true });
    expect(warn).not.toHaveBeenCalled();
  });

  it('keeps a poem kind intact', () => {
    const kind = kindSchema.parse({ discriminant: 'poem', value: { form: 'sonnet', poems: [{ title: '', verse: 'a\nb' }] } });
    expect(kind.discriminant).toBe('poem');
    if (kind.discriminant === 'poem') {
      expect(kind.value.poems[0].verse).toBe('a\nb');
      expect(kind.value.form).toBe('sonnet');
    }
  });

  it('falls back to an empty prose kind when the kind is unknown, and says so', () => {
    expect(kindSchema.parse({ discriminant: 'video', value: {} }).discriminant).toBe('prose');
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('[content] kind'));
  });
});

describe('relativeImagePath', () => {
  it('prefixes bare file names so Astro resolves them next to the entry', () => {
    expect(relativeImagePath('image.jpg')).toBe('./image.jpg');
  });

  it('leaves relative and absolute paths alone', () => {
    expect(relativeImagePath('./image.jpg')).toBe('./image.jpg');
    expect(relativeImagePath('/papers/x.pdf')).toBe('/papers/x.pdf');
  });

  it('turns an empty string into null', () => {
    expect(relativeImagePath('')).toBeNull();
    expect(relativeImagePath(null)).toBeNull();
    expect(relativeImagePath(undefined)).toBeNull();
  });
});

describe('other schemas', () => {
  it('coerces category order and defaults it to 1', () => {
    expect(categorySchema.parse({ name: 'Poetry', order: '4' }).order).toBe(4);
    expect(categorySchema.parse({ name: 'Poetry' }).order).toBe(1);
  });

  it('keeps a category shown when its file has no hidden line, without a warning', () => {
    expect(categorySchema.parse({ name: 'Poetry' }).hidden).toBe(false);
    expect(warn).not.toHaveBeenCalled();
  });

  it('keeps a category shown when hidden is not a boolean, and says so', () => {
    expect(categorySchema.parse({ name: 'Poetry', hidden: 'yes' }).hidden).toBe(false);
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('[content] hidden'));
  });

  it('hides a category whose hidden flag is on', () => {
    expect(categorySchema.parse({ name: 'Poetry', hidden: true }).hidden).toBe(true);
  });

  it('defaults contact links to an empty list and the heading to Contact me', () => {
    const contact = contactSchema.parse({ email: 'a@b.c', links: 'nope' });
    expect(contact.links).toEqual([]);
    expect(contact.heading).toBe('Contact me');
  });

  it('defaults settings name and tagline', () => {
    const settings = settingsSchema.parse({});
    expect(settings.name).toBe('Charlotte Rose');
    expect(settings.tagline).toBe('writer and editor');
    expect(settings.description).toBe('');
  });
});

describe('category layout', () => {
  const layoutOf = (layout: unknown) => categorySchema.parse({ name: 'Poetry', layout }).layout;

  it('shows a category without a layout line as tiles, four across, without a warning', () => {
    expect(categorySchema.parse({ name: 'Poetry' }).layout).toEqual({ discriminant: 'tiles', value: { perRow: 4 } });
    expect(warn).not.toHaveBeenCalled();
  });

  it('keeps a chosen number of tiles per row, coercing a numeric string', () => {
    expect(layoutOf({ discriminant: 'tiles', value: { perRow: 3 } })).toEqual({ discriminant: 'tiles', value: { perRow: 3 } });
    expect(layoutOf({ discriminant: 'tiles', value: { perRow: '6' } })).toEqual({ discriminant: 'tiles', value: { perRow: 6 } });
  });

  it('falls back to four across when tiles per row is out of range or not a number, and says so', () => {
    expect(layoutOf({ discriminant: 'tiles', value: { perRow: 9 } })).toEqual({ discriminant: 'tiles', value: { perRow: 4 } });
    expect(layoutOf({ discriminant: 'tiles', value: { perRow: 'many' } })).toEqual({ discriminant: 'tiles', value: { perRow: 4 } });
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('[content] tiles per row'));
  });

  it('keeps a rows layout with its images flag, and reads a missing flag as off without a warning', () => {
    expect(layoutOf({ discriminant: 'rows', value: { images: true } })).toEqual({ discriminant: 'rows', value: { images: true } });
    expect(layoutOf({ discriminant: 'rows', value: {} })).toEqual({ discriminant: 'rows', value: { images: false } });
    expect(warn).not.toHaveBeenCalled();
  });

  it('falls back to tiles when the layout is unknown, and says so', () => {
    expect(layoutOf({ discriminant: 'masonry', value: {} })).toEqual({ discriminant: 'tiles', value: { perRow: 4 } });
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('[content] layout'));
  });
});

describe('piece extra line', () => {
  it('gives a piece without an extra line choice no extra line, without a warning', () => {
    const piece = pieceBaseSchema.parse({ title: 't', kind: { discriminant: 'prose', value: { body: '' } }, date: '2024-03-15' });
    expect(piece.extraLine).toBe('none');
    expect(warn).not.toHaveBeenCalled();
  });

  it('keeps a chosen extra line', () => {
    expect(pieceBaseSchema.parse({ title: 't', extraLine: 'description' }).extraLine).toBe('description');
    expect(pieceBaseSchema.parse({ title: 't', extraLine: 'excerpt' }).extraLine).toBe('excerpt');
  });

  it('falls back to no extra line when the choice is unknown, and says so', () => {
    expect(pieceBaseSchema.parse({ title: 't', extraLine: 'abstract' }).extraLine).toBe('none');
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('[content] extra line'));
  });
});
