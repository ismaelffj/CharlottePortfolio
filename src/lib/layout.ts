// Shared by the admin form and the site's schema; keep this file free of imports so the admin bundle stays lean.

/** How many tiles sit across a category grid on desktop. */
export const TILES_PER_ROW = { min: 2, max: 6, fallback: 4 } as const;

/** The optional line under the title on the home page, in a tile caption or a row, above where the piece appeared. */
export const EXTRA_LINES = ['none', 'description', 'excerpt'] as const;
export type ExtraLine = (typeof EXTRA_LINES)[number];
export const DEFAULT_EXTRA_LINE: ExtraLine = 'none';
