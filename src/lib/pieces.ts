import type { ImageMetadata } from 'astro';
import type { CategoryData, PieceData } from './schemas';
import { toPlainText } from './markdoc';
import { readingMinutes, smartQuotes } from './text';

export type PieceKind = 'prose' | 'poem' | 'paper';

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
  dek: string;
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
}

export interface Section {
  slug: string;
  name: string;
  pieces: Piece[];
  uncategorized: boolean;
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
    dek: smartQuotes(data.dek),
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

export function normalizeCategory(slug: string, data: CategoryData): Category {
  return { slug, name: data.name, order: data.order, hidden: data.hidden };
}

export function publishedSorted(pieces: Piece[]): Piece[] {
  return pieces
    .filter((p) => p.published)
    .sort((a, b) => b.date.getTime() - a.date.getTime() || a.title.localeCompare(b.title));
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
    .map((c) => ({ slug: c.slug, name: c.name, uncategorized: false, pieces: pieces.filter((p) => p.categorySlug === c.slug) }))
    .filter((s) => s.pieces.length > 0);

  const orphans = pieces.filter((p) => !known.has(p.categorySlug));
  for (const orphan of orphans) {
    console.warn(`[content] piece "${orphan.slug}" points to the missing category "${orphan.categorySlug}"; showing it under ${UNCATEGORIZED.name}.`);
  }
  if (orphans.length > 0) {
    sections.push({ slug: UNCATEGORIZED.slug, name: UNCATEGORIZED.name, uncategorized: true, pieces: orphans });
  }
  return sections;
}
