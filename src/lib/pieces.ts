import type { ImageMetadata } from 'astro';
import { DEFAULT_ROW_TEXT, TILES_PER_ROW, type RowText } from './layout';
import type { CategoryData, LayoutData, PieceData } from './schemas';
import { toPlainText } from './markdoc';
import { readingMinutes, smartQuotes } from './text';

export type PieceKind = 'prose' | 'poem' | 'paper';

/** How a home page section lists its pieces: a grid of squares, or one row per piece with an optional thumbnail. */
export type CategoryLayout = { kind: 'tiles'; perRow: number } | { kind: 'rows'; images: boolean };

export const DEFAULT_LAYOUT: CategoryLayout = { kind: 'tiles', perRow: TILES_PER_ROW.fallback };

export interface Poem {
  title: string;
  verse: string;
}

export interface Piece {
  kind: PieceKind;
  slug: string;
  url: string;
  title: string;
  categorySlug: string;
  date: Date;
  published: boolean;
  featured: boolean;
  dek: string;
  rowText: RowText;
  image: ImageMetadata | null;
  imageAlt: string;
  openingLines: string;
  editorsNote: string;
  outlet: { name: string; url: string };
  body: string;
  form: string;
  poems: Poem[];
  venue: string;
  coauthors: string;
  abstract: string;
  pdf: string;
  readingMinutes: number;
  plainText: string;
}

export interface Category {
  slug: string;
  name: string;
  order: number;
  hidden: boolean;
  layout: CategoryLayout;
}

export interface Section {
  slug: string;
  name: string;
  pieces: Piece[];
  uncategorized: boolean;
  layout: CategoryLayout;
}

export interface FeaturedEntry {
  piece: Piece;
  /** The name of the home page section the piece belongs to, since a featured card sits outside it. */
  categoryName: string;
}

export const UNCATEGORIZED = { slug: 'uncategorized', name: 'Uncategorized' } as const;

export type PieceInput = PieceData & { image?: ImageMetadata | null };

export function normalizePiece(slug: string, data: PieceInput): Piece {
  const base: Piece = {
    kind: data.kind.discriminant,
    slug,
    url: `/writing/${slug}/`,
    title: smartQuotes(data.title),
    categorySlug: data.category,
    date: data.date,
    published: data.published,
    featured: data.featured,
    dek: smartQuotes(data.dek),
    // Missing only from an entry a cached content store parsed before the field existed; see normalizeLayout.
    rowText: data.rowText ?? DEFAULT_ROW_TEXT,
    image: data.image ?? null,
    imageAlt: data.imageAlt,
    openingLines: smartQuotes(data.openingLines),
    editorsNote: smartQuotes(data.editorsNote),
    outlet: { name: '', url: '' },
    body: '',
    form: '',
    poems: [],
    venue: '',
    coauthors: '',
    abstract: '',
    pdf: '',
    readingMinutes: 0,
    plainText: '',
  };

  switch (data.kind.discriminant) {
    case 'prose': {
      const plainText = toPlainText(data.kind.value.body);
      return {
        ...base,
        outlet: data.kind.value.outlet,
        body: data.kind.value.body,
        plainText,
        readingMinutes: readingMinutes(plainText),
      };
    }
    case 'poem': {
      const poems = data.kind.value.poems.map((p) => ({ title: smartQuotes(p.title), verse: smartQuotes(p.verse) }));
      return {
        ...base,
        form: data.kind.value.form,
        poems,
        plainText: poems.map((p) => p.verse).join(' ').replace(/\s+/g, ' ').trim(),
      };
    }
    case 'paper':
      return {
        ...base,
        venue: data.kind.value.venue,
        coauthors: data.kind.value.coauthors,
        abstract: smartQuotes(data.kind.value.abstract),
        pdf: data.kind.value.pdf,
        plainText: data.kind.value.abstract.replace(/\s+/g, ' ').trim(),
      };
  }
}

/**
 * A cached content store keeps entries parsed under an older schema until their file
 * changes (see content.config.ts), so an entry can arrive without a layout at all.
 * Such a file has no layout line, and the default is what a fresh parse would give it.
 */
function normalizeLayout(data: LayoutData | undefined): CategoryLayout {
  if (!data) return DEFAULT_LAYOUT;
  return data.discriminant === 'rows' ? { kind: 'rows', images: data.value.images } : { kind: 'tiles', perRow: data.value.perRow };
}

export function normalizeCategory(slug: string, data: CategoryData): Category {
  return { slug, name: data.name, order: data.order, hidden: data.hidden, layout: normalizeLayout(data.layout) };
}

const newestFirst = (a: Piece, b: Piece) => b.date.getTime() - a.date.getTime() || a.title.localeCompare(b.title);

export function publishedSorted(pieces: Piece[]): Piece[] {
  return pieces.filter((p) => p.published).sort(newestFirst);
}

export function sortCategories(categories: Category[]): Category[] {
  return [...categories].sort((a, b) => a.order - b.order || a.name.localeCompare(b.name));
}

/** Drops the pieces of hidden categories; pieces of a deleted category stay so they can surface as Uncategorized. */
export function withoutHiddenCategories(pieces: Piece[], categories: Category[]): Piece[] {
  const hidden = new Set(categories.filter((c) => c.hidden).map((c) => c.slug));
  return pieces.filter((p) => !hidden.has(p.categorySlug));
}

/** Groups already-filtered pieces into sections in category order; orphans go last. */
export function groupByCategory(pieces: Piece[], categories: Category[]): Section[] {
  const known = new Set(categories.map((c) => c.slug));
  const sections: Section[] = sortCategories(categories)
    .map((c) => ({
      slug: c.slug,
      name: c.name,
      uncategorized: false,
      layout: c.layout,
      pieces: pieces.filter((p) => p.categorySlug === c.slug),
    }))
    .filter((s) => s.pieces.length > 0);

  const orphans = pieces.filter((p) => !known.has(p.categorySlug));
  for (const orphan of orphans) {
    console.warn(`[content] piece "${orphan.slug}" points to the missing category "${orphan.categorySlug}"; showing it under ${UNCATEGORIZED.name}.`);
  }
  if (orphans.length > 0) {
    sections.push({ slug: UNCATEGORIZED.slug, name: UNCATEGORIZED.name, uncategorized: true, layout: DEFAULT_LAYOUT, pieces: orphans });
  }
  return sections;
}

/** The featured pieces across every section, newest first, each with the name of its section. */
export function featuredEntries(sections: Section[]): FeaturedEntry[] {
  return sections
    .flatMap((section) => section.pieces.filter((p) => p.featured).map((piece) => ({ piece, categoryName: section.name })))
    .sort((a, b) => newestFirst(a.piece, b.piece));
}
