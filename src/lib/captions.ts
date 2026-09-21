import { formatMonthYear, formatYear } from './dates';
import type { Category, Piece } from './pieces';
import { excerpt } from './text';

export interface MetaLine {
  /** "Originally published in <label>", linked when href is set. */
  published?: { label: string; href?: string };
  items: string[];
}

const SEPARATOR = ' · ';

function join(parts: Array<string | undefined>): string {
  return parts.map((p) => p?.trim() ?? '').filter(Boolean).join(SEPARATOR);
}

export function hostnameOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}

export function outletLabel(outlet: { name: string; url: string }): string {
  if (outlet.name.trim()) return outlet.name.trim();
  if (outlet.url.trim()) return hostnameOf(outlet.url.trim());
  return '';
}

/** Where the piece appeared: its outlet, form, or venue; empty when it appeared nowhere. */
export function captionDetail(piece: Piece): string {
  switch (piece.kind) {
    case 'prose':
      return outletLabel(piece.outlet);
    case 'poem':
      return piece.form.trim();
    case 'paper':
      return piece.venue.trim();
  }
}

/** Month and year for prose, the year alone for poems and papers. */
export function captionDate(piece: Piece): string {
  return piece.kind === 'prose' ? formatMonthYear(piece.date) : formatYear(piece.date);
}

/** The caption under a tile on the home page; the section heading above the grid already names the category. */
export function captionMeta(piece: Piece): string {
  return join([captionDetail(piece), captionDate(piece)]);
}

export interface RowLine {
  /** Decides the type: publication in the meta face, the rest in the body face; lines in quotes. */
  kind: 'publication' | 'description' | 'excerpt' | 'lines';
  text: string;
}

/**
 * The line under the title in a rows section, by the piece's Row text choice. A chosen
 * description or excerpt that turns out empty falls back to the publication line, which
 * itself falls back to the opening lines, so a row never shows a gap.
 */
export function rowLine(piece: Piece): RowLine | null {
  if (piece.rowText === 'description' && piece.dek.trim()) return { kind: 'description', text: piece.dek.trim() };
  if (piece.rowText === 'excerpt') {
    const text = excerpt(piece.plainText);
    if (text) return { kind: 'excerpt', text };
  }
  const detail = captionDetail(piece);
  if (detail) return { kind: 'publication', text: detail };
  const lines = piece.openingLines.trim();
  return lines ? { kind: 'lines', text: lines } : null;
}

/** The meta line on a featured card, which sits outside its section and so names the category itself. */
export function featuredMeta(piece: Piece, categoryName: string): string {
  return join([categoryName, captionMeta(piece)]);
}

/** The meta line under a piece's dek. */
export function pieceMetaLine(piece: Piece): MetaLine {
  const date = formatMonthYear(piece.date);
  switch (piece.kind) {
    case 'prose': {
      const label = outletLabel(piece.outlet);
      return {
        published: label ? { label, href: piece.outlet.url.trim() || undefined } : undefined,
        items: [date, `${piece.readingMinutes} min read`],
      };
    }
    case 'poem':
      return { items: [piece.form.trim(), date].filter(Boolean) };
    case 'paper':
      return { items: [piece.venue.trim(), date, piece.coauthors.trim()].filter(Boolean) };
  }
}

export function pieceLabel(category: Category | undefined): string {
  return category?.name ?? 'Writing';
}

export function backLink(category: Category | undefined): { href: string; label: string } {
  return category ? { href: `/#${category.slug}`, label: `All ${category.name}` } : { href: '/', label: 'All writing' };
}
