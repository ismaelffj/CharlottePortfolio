import { formatMonthYear, formatYear } from './dates';
import type { Category, Piece } from './pieces';

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

/** The caption under a tile on the home page. */
export function captionMeta(piece: Piece, categoryName: string): string {
  switch (piece.kind) {
    case 'prose':
      return join([categoryName, outletLabel(piece.outlet), formatMonthYear(piece.date)]);
    case 'poem':
      return join([categoryName, piece.form, formatYear(piece.date)]);
    case 'paper':
      return join([categoryName, piece.venue, formatYear(piece.date)]);
  }
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
