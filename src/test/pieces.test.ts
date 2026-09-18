import { afterEach, describe, expect, it, vi } from 'vitest';
import { pieceBaseSchema } from '../lib/schemas';
import {
  UNCATEGORIZED,
  groupByCategory,
  normalizeCategory,
  normalizePiece,
  publishedSorted,
  sortCategories,
  type Category,
} from '../lib/pieces';

const piece = (slug: string, overrides: Record<string, unknown> = {}) =>
  normalizePiece(slug, pieceBaseSchema.parse({ title: slug, published: true, ...overrides }));

const categories: Category[] = [
  normalizeCategory('poetry', { name: 'Poetry', order: 4 }),
  normalizeCategory('articles', { name: 'Articles', order: 1 }),
  normalizeCategory('essays', { name: 'Essays', order: 2 }),
];

describe('normalizePiece', () => {
  it('builds a prose piece with url, reading time, and plain text', () => {
    const p = piece('night-shift', {
      kind: { discriminant: 'prose', value: { outlet: { name: 'The Daily', url: 'https://d.example' }, body: 'Some *body* text. ' + 'word '.repeat(459) } },
      category: 'articles',
      date: '2024-03-15',
    });
    expect(p.kind).toBe('prose');
    expect(p.url).toBe('/writing/night-shift/');
    expect(p.outlet).toEqual({ name: 'The Daily', url: 'https://d.example' });
    expect(p.readingMinutes).toBe(2);
    expect(p.plainText.startsWith('Some body text.')).toBe(true);
    expect(p.poems).toEqual([]);
    expect(p.image).toBeNull();
  });

  it('builds a poem piece whose plain text is the verse', () => {
    const p = piece('three-poems', {
      kind: { discriminant: 'poem', value: { form: 'free verse', poems: [{ title: 'A', verse: 'line one\nline two' }, { title: '', verse: 'more' }] } },
    });
    expect(p.kind).toBe('poem');
    expect(p.form).toBe('free verse');
    expect(p.poems).toHaveLength(2);
    expect(p.plainText).toBe('line one line two more');
    expect(p.readingMinutes).toBe(0);
  });

  it('builds a paper piece whose plain text is the abstract', () => {
    const p = piece('census', {
      kind: { discriminant: 'paper', value: { venue: 'Journal', coauthors: 'With J. Ortiz', abstract: 'We count.', pdf: '/papers/census/paper.pdf' } },
    });
    expect(p.kind).toBe('paper');
    expect(p.venue).toBe('Journal');
    expect(p.pdf).toBe('/papers/census/paper.pdf');
    expect(p.plainText).toBe('We count.');
    expect(p.readingMinutes).toBe(0);
  });

  it('applies smart quotes to the title, dek, and opening lines', () => {
    const p = piece('q', { title: 'What\'s "kept"', dek: 'It\'s here', openingLines: '"Go," she said.' });
    expect(p.title).toBe('What’s “kept”');
    expect(p.dek).toBe('It’s here');
    expect(p.openingLines).toBe('“Go,” she said.');
  });
});

describe('publishedSorted', () => {
  it('drops drafts and sorts newest first, then by title', () => {
    const list = [
      piece('b', { date: '2024-01-01' }),
      piece('draft', { date: '2025-01-01', published: false }),
      piece('a', { date: '2024-01-01' }),
      piece('c', { date: '2025-01-01' }),
    ];
    expect(publishedSorted(list).map((p) => p.slug)).toEqual(['c', 'a', 'b']);
  });
});

describe('sortCategories', () => {
  it('sorts by order, then name', () => {
    const list = [
      normalizeCategory('z', { name: 'Zeta', order: 2 }),
      normalizeCategory('a', { name: 'Alpha', order: 2 }),
      normalizeCategory('m', { name: 'Mid', order: 1 }),
    ];
    expect(sortCategories(list).map((c) => c.slug)).toEqual(['m', 'a', 'z']);
  });
});

describe('groupByCategory', () => {
  afterEach(() => vi.restoreAllMocks());

  it('groups published pieces into ordered sections and skips empty categories', () => {
    const list = publishedSorted([
      piece('poem-1', { category: 'poetry', date: '2024-06-01' }),
      piece('article-1', { category: 'articles', date: '2024-03-01' }),
      piece('article-2', { category: 'articles', date: '2024-05-01' }),
    ]);
    const sections = groupByCategory(list, categories);
    expect(sections.map((s) => s.slug)).toEqual(['articles', 'poetry']);
    expect(sections[0].pieces.map((p) => p.slug)).toEqual(['article-2', 'article-1']);
    expect(sections[0].name).toBe('Articles');
    expect(sections.every((s) => !s.uncategorized)).toBe(true);
  });

  it('puts pieces with a missing category in a trailing Uncategorized section and warns', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const list = publishedSorted([
      piece('orphan', { category: 'deleted' }),
      piece('poem-1', { category: 'poetry' }),
    ]);
    const sections = groupByCategory(list, categories);
    expect(sections.map((s) => s.slug)).toEqual(['poetry', UNCATEGORIZED.slug]);
    expect(sections[1].name).toBe(UNCATEGORIZED.name);
    expect(sections[1].uncategorized).toBe(true);
    expect(sections[1].pieces[0].slug).toBe('orphan');
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('orphan'));
  });

  it('returns no sections when nothing is published', () => {
    expect(groupByCategory([], categories)).toEqual([]);
  });
});
