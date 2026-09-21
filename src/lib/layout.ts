// Shared by the admin form and the site's schema; keep this file free of imports so the admin bundle stays lean.

/** How many tiles sit across a category grid on desktop. */
export const TILES_PER_ROW = { min: 2, max: 6, fallback: 4 } as const;

/** The optional text line a row shows under the title, above where the piece appeared, when its category uses the rows layout. */
export const ROW_TEXTS = ['none', 'description', 'excerpt'] as const;
export type RowText = (typeof ROW_TEXTS)[number];
export const DEFAULT_ROW_TEXT: RowText = 'none';
