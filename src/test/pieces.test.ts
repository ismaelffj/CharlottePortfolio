import { afterEach, describe, expect, it, vi } from 'vitest';
import { categorySchema, pieceBaseSchema, type CategoryData, type PieceData } from '../lib/schemas';
import {
  UNCATEGORIZED,
  featuredEntries,
  groupByCategory,
  normalizeCategory,
  normalizePiece,
  publishedSorted,
  sortCategories,
  withoutHiddenCategories,
  type Category,
} from '../lib/pieces';

const piece = (slug: string, overrides: Record<string, unknown> = {}) =>
  normalizePiece(slug, pieceBaseSchema.parse({ title: slug, published: true, ...overrides }));

const category = (slug: string, overrides: Record<string, unknown> = {}) =>
  normalizeCategory(slug, categorySchema.parse({ name: slug, ...overrides }));

const categories: Category[] = [
  category('poetry', { name: 'Poetry', order: 4 }),
  category('articles', { name: 'Articles', order: 1 }),
  category('essays', { name: 'Essays', order: 2 }),
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

  it('carries the featured flag', () => {
    expect(piece('lead', { featured: true }).featured).toBe(true);
    expect(piece('plain').featured).toBe(false);
  });

  it('carries the extra line choice, none by default', () => {
    expect(piece('paper', { extraLine: 'excerpt' }).extraLine).toBe('excerpt');
    expect(piece('plain').extraLine).toBe('none');
  });

  it('gives an entry parsed before the extra line existed the default, so a cached content store cannot break the build', () => {
    const stale = { ...pieceBaseSchema.parse({ title: 'Old' }), extraLine: undefined } as unknown as PieceData;
    expect(normalizePiece('old', stale).extraLine).toBe('none');
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

describe('normalizeCategory', () => {
  it('carries the hidden flag', () => {
    expect(category('speeches', { hidden: true }).hidden).toBe(true);
    expect(category('poetry').hidden).toBe(false);
  });

  it('flattens the layout, tiles four across by default', () => {
    expect(category('poetry').layout).toEqual({ kind: 'tiles', perRow: 4 });
    expect(category('poetry', { layout: { discriminant: 'tiles', value: { perRow: 3 } } }).layout).toEqual({ kind: 'tiles', perRow: 3 });
    expect(category('talks', { layout: { discriminant: 'rows', value: { images: true } } }).layout).toEqual({ kind: 'rows', images: true });
  });

  it('gives an entry parsed before the layout existed the default layout, so a cached content store cannot break the build', () => {
    const stale = { ...categorySchema.parse({ name: 'Poetry' }), layout: undefined } as unknown as CategoryData;
    expect(normalizeCategory('poetry', stale).layout).toEqual({ kind: 'tiles', perRow: 4 });
  });
});

describe('sortCategories', () => {
  it('sorts by order, then name', () => {
    const list = [
      category('z', { name: 'Zeta', order: 2 }),
      category('a', { name: 'Alpha', order: 2 }),
      category('m', { name: 'Mid', order: 1 }),
    ];
    expect(sortCategories(list).map((c) => c.slug)).toEqual(['m', 'a', 'z']);
  });
});

describe('withoutHiddenCategories', () => {
  const withHidden = [...categories, category('speeches', { name: 'Speeches', order: 5, hidden: true })];

  it('drops the pieces of a hidden category and keeps the rest', () => {
    const list = [piece('talk', { category: 'speeches' }), piece('poem-1', { category: 'poetry' })];
    expect(withoutHiddenCategories(list, withHidden).map((p) => p.slug)).toEqual(['poem-1']);
  });

  it('keeps pieces whose category no longer exists, so they can still surface as Uncategorized', () => {
    const list = [piece('orphan', { category: 'deleted' })];
    expect(withoutHiddenCategories(list, withHidden).map((p) => p.slug)).toEqual(['orphan']);
  });
});

describe('featuredEntries', () => {
  const sectionsOf = (...pieces: ReturnType<typeof piece>[]) => groupByCategory(publishedSorted(pieces), categories);

  it('picks the featured pieces out of every section with their section names, newest first', () => {
    const entries = featuredEntries(
      sectionsOf(
        piece('older-lead', { category: 'articles', date: '2024-05-14', featured: true }),
        piece('filler', { category: 'articles', date: '2025-01-01' }),
        piece('newer-lead', { category: 'essays', date: '2026-02-22', featured: true }),
      ),
    );
    expect(entries.map((e) => e.piece.slug)).toEqual(['newer-lead', 'older-lead']);
    expect(entries.map((e) => e.categoryName)).toEqual(['Essays', 'Articles']);
  });

  it('breaks date ties by title', () => {
    const entries = featuredEntries(
      sectionsOf(piece('b', { category: 'poetry', featured: true }), piece('a', { category: 'articles', featured: true })),
    );
    expect(entries.map((e) => e.piece.slug)).toEqual(['a', 'b']);
  });

  it('names the section of an orphaned piece Uncategorized', () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    const entries = featuredEntries(sectionsOf(piece('orphan', { category: 'deleted', featured: true })));
    expect(entries[0].categoryName).toBe(UNCATEGORIZED.name);
  });

  it('returns nothing when no piece is featured', () => {
    expect(featuredEntries(sectionsOf(piece('filler', { category: 'articles' })))).toEqual([]);
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

  it('carries each category’s layout onto its section, and gives Uncategorized the tile grid', () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    const talks = category('talks', { name: 'Talks', order: 3, layout: { discriminant: 'rows', value: { images: false } } });
    const list = publishedSorted([piece('talk', { category: 'talks' }), piece('orphan', { category: 'deleted' })]);
    const sections = groupByCategory(list, [...categories, talks]);
    expect(sections.find((s) => s.slug === 'talks')?.layout).toEqual({ kind: 'rows', images: false });
    expect(sections.find((s) => s.uncategorized)?.layout).toEqual({ kind: 'tiles', perRow: 4 });
  });
});
