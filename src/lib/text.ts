const WORDS_PER_MINUTE = 230;
const ELLIPSIS = '…';

/** Straight quotes and apostrophes to curly ones. Opening marks follow a space or an opening bracket; everything else closes. */
export function smartQuotes(text: string): string {
  return text
    .replace(/(^|[\s([{<])"/g, '$1“')
    .replace(/"/g, '”')
    .replace(/(^|[\s([{<])'/g, '$1‘')
    .replace(/'/g, '’');
}

export function readingMinutes(text: string): number {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / WORDS_PER_MINUTE));
}

/** Collapses whitespace and cuts at the last word boundary before `max`, adding an ellipsis. */
export function excerpt(text: string, max = 155): string {
  const collapsed = text.replace(/\s+/g, ' ').trim();
  if (collapsed.length <= max) return collapsed;
  const cut = collapsed.slice(0, max);
  const lastSpace = cut.lastIndexOf(' ');
  return (lastSpace > 0 ? cut.slice(0, lastSpace) : cut).trimEnd() + ELLIPSIS;
}
