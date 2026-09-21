import { describe, expect, it } from 'vitest';
import { categorySchema, pieceBaseSchema } from '../lib/schemas';
import { normalizeCategory, normalizePiece } from '../lib/pieces';
import {
  backLink,
  captionDate,
  captionDetail,
  captionMeta,
  featuredMeta,
  hostnameOf,
  outletLabel,
  pieceLabel,
  pieceMetaLine,
  extraLineText,
} from '../lib/captions';

const piece = (overrides: Record<string, unknown>) =>
  normalizePiece('slug', pieceBaseSchema.parse({ title: 'T', published: true, date: '2024-03-15', ...overrides }));

const prose = (outlet: { name: string; url: string }, words = 2070) =>
  piece({ kind: { discriminant: 'prose', value: { outlet, body: 'word '.repeat(words) } } });

/** A talk: prose with no outlet, so the row line has nothing to fall back on but what the overrides give it. */
const talk = (overrides: Record<string, unknown>, body = '') =>
  piece({ kind: { discriminant: 'prose', value: { outlet: { name: '', url: '' }, body } }, ...overrides });

const poem = piece({ kind: { discriminant: 'poem', value: { form: 'free verse', poems: [{ title: '', verse: 'x' }] } } });
const paper = (overrides: Record<string, unknown> = {}, abstract = 'a') =>
  piece({ kind: { discriminant: 'paper', value: { venue: 'Journal of Sociology', coauthors: '', abstract, pdf: '/p.pdf' } }, ...overrides });

describe('captionDetail and captionDate', () => {
  it('split the caption into where the piece appeared and when', () => {
    expect(captionDetail(prose({ name: 'The Daily', url: '' }))).toBe('The Daily');
    expect(captionDate(prose({ name: 'The Daily', url: '' }))).toBe('March 2024');
    expect(captionDetail(poem)).toBe('free verse');
    expect(captionDate(poem)).toBe('2024');
    expect(captionDetail(paper())).toBe('Journal of Sociology');
    expect(captionDate(paper())).toBe('2024');
  });

  it('give an empty detail when the piece appeared nowhere', () => {
    expect(captionDetail(prose({ name: '', url: '' }))).toBe('');
  });
});

describe('extraLineText', () => {
  it('gives no text line by default, whatever the piece has to offer', () => {
    expect(extraLineText(paper({ dek: 'What the payroll forgot.', openingLines: 'We counted.' }))).toBeNull();
    expect(extraLineText(talk({ openingLines: 'The first thing the water took.' }))).toBeNull();
  });

  it('shows the one-line description when chosen', () => {
    expect(extraLineText(paper({ extraLine: 'description', dek: 'What the payroll forgot.' }))).toBe('What the payroll forgot.');
  });

  it('shows the typed opening lines, quoted, when the opening of the text is chosen', () => {
    const line = extraLineText(paper({ extraLine: 'excerpt', openingLines: 'The first thing the water took.' }, 'word '.repeat(60)));
    expect(line).toBe('“The first thing the water took.”');
  });

  it('falls back to the text itself, cut at a word boundary with an ellipsis, when no opening lines were typed', () => {
    const line = extraLineText(paper({ extraLine: 'excerpt' }, 'word '.repeat(60)));
    expect(line?.startsWith('word word')).toBe(true);
    expect(line?.endsWith('…')).toBe(true);
    expect(line?.length).toBeLessThanOrEqual(156);
    expect(extraLineText(talk({ extraLine: 'excerpt' }, 'A short body.'))).toBe('A short body.');
  });

  it('gives no text line when the chosen text is empty', () => {
    expect(extraLineText(paper({ extraLine: 'description' }))).toBeNull();
    expect(extraLineText(paper({ extraLine: 'excerpt' }, ''))).toBeNull();
  });
});

describe('captionMeta', () => {
  it('formats prose with the outlet and month, without the category its section already names', () => {
    expect(captionMeta(prose({ name: 'The Daily', url: '' }))).toBe('The Daily · March 2024');
  });

  it('drops the outlet segment when there is none', () => {
    expect(captionMeta(prose({ name: '', url: '' }))).toBe('March 2024');
  });

  it('formats poems with the form and year', () => {
    const p = piece({ kind: { discriminant: 'poem', value: { form: 'free verse', poems: [{ title: '', verse: 'x' }] } } });
    expect(captionMeta(p)).toBe('free verse · 2024');
  });

  it('formats papers with the venue and year', () => {
    const p = piece({ kind: { discriminant: 'paper', value: { venue: 'Journal of Sociology', coauthors: '', abstract: 'a', pdf: '/p.pdf' } } });
    expect(captionMeta(p)).toBe('Journal of Sociology · 2024');
  });
});

describe('featuredMeta', () => {
  it('leads with the category, because a featured card sits outside its section', () => {
    expect(featuredMeta(prose({ name: 'The Daily', url: '' }), 'Articles')).toBe('Articles · The Daily · March 2024');
  });
});

describe('pieceMetaLine', () => {
  it('links the outlet and adds date and reading time for a clip', () => {
    const line = pieceMetaLine(prose({ name: 'The Daily', url: 'https://www.daily.example/x' }));
    expect(line.published).toEqual({ label: 'The Daily', href: 'https://www.daily.example/x' });
    expect(line.items).toEqual(['March 2024', '9 min read']);
  });

  it('uses the hostname when the outlet has a link but no name', () => {
    const line = pieceMetaLine(prose({ name: '', url: 'https://www.daily.example/x' }));
    expect(line.published).toEqual({ label: 'daily.example', href: 'https://www.daily.example/x' });
  });

  it('shows the outlet name without a link when there is no url', () => {
    const line = pieceMetaLine(prose({ name: 'The Daily', url: '' }));
    expect(line.published).toEqual({ label: 'The Daily', href: undefined });
  });

  it('omits the published part for unpublished prose', () => {
    const line = pieceMetaLine(prose({ name: '', url: '' }, 230));
    expect(line.published).toBeUndefined();
    expect(line.items).toEqual(['March 2024', '1 min read']);
  });

  it('formats poems and papers without reading time', () => {
    const poem = piece({ kind: { discriminant: 'poem', value: { form: '', poems: [{ title: '', verse: 'x' }] } } });
    expect(pieceMetaLine(poem).items).toEqual(['March 2024']);
    const paper = piece({ kind: { discriminant: 'paper', value: { venue: 'Journal', coauthors: 'With J. Ortiz', abstract: 'a', pdf: '/p.pdf' } } });
    expect(pieceMetaLine(paper).items).toEqual(['Journal', 'March 2024', 'With J. Ortiz']);
  });
});

describe('labels and links', () => {
  const poetry = normalizeCategory('poetry', categorySchema.parse({ name: 'Poetry', order: 4 }));

  it('labels a piece with its category name, or Writing when orphaned', () => {
    expect(pieceLabel(poetry)).toBe('Poetry');
    expect(pieceLabel(undefined)).toBe('Writing');
  });

  it('builds the back link to the section anchor, or home when orphaned', () => {
    expect(backLink(poetry)).toEqual({ href: '/#poetry', label: 'All Poetry' });
    expect(backLink(undefined)).toEqual({ href: '/', label: 'All writing' });
  });

  it('derives outlet labels and hostnames', () => {
    expect(outletLabel({ name: ' The Daily ', url: '' })).toBe('The Daily');
    expect(outletLabel({ name: '', url: 'https://www.daily.example/a' })).toBe('daily.example');
    expect(outletLabel({ name: '', url: '' })).toBe('');
    expect(hostnameOf('not a url')).toBe('not a url');
  });
});
