import { z } from 'astro/zod';
import { DEFAULT_ROW_TEXT, ROW_TEXTS, TILES_PER_ROW } from './layout';

// Every schema here is tolerant: a missing or malformed value becomes a safe
// fallback instead of failing the build, because Charlotte gets no signal when
// a deploy fails. Hard failures are reserved for code errors.

type Issue = { message?: string; code?: string };

const describe = (issues: ReadonlyArray<Issue>) =>
  issues.map((issue) => issue.message ?? issue.code ?? 'invalid value').join('; ');

/** Logged when a value is present but unusable; a missing optional string is normal and stays silent. */
const warn = (field: string, issues: ReadonlyArray<Issue>) =>
  console.warn(`[content] ${field}: ${describe(issues)}; using a fallback.`);

export const str = (fallback = '') =>
  z
    .string()
    .nullish()
    .transform((value) => value ?? fallback)
    .catch(fallback);

export const bool = (field: string, fallback = false) =>
  z
    .boolean()
    .nullish()
    .transform((value) => value ?? fallback)
    .catch((ctx) => {
      warn(field, ctx.issues);
      return fallback;
    });

export const isoDate = (field = 'date') =>
  z.coerce.date().catch((ctx) => {
    warn(field, ctx.issues);
    return new Date();
  });

/** Keystatic stores a co-located image as a bare file name; Astro resolves only relative paths. */
export const relativeImagePath = (value: unknown): unknown => {
  if (value === '' || value === null || value === undefined) return null;
  if (typeof value !== 'string') return value;
  if (value.startsWith('.') || value.startsWith('/')) return value;
  return `./${value}`;
};

const tilesPerRow = z
  .preprocess(
    (value) => value ?? TILES_PER_ROW.fallback,
    z.coerce.number().int().min(TILES_PER_ROW.min).max(TILES_PER_ROW.max),
  )
  .catch((ctx) => {
    warn('tiles per row', ctx.issues);
    return TILES_PER_ROW.fallback;
  });

const defaultLayout = { discriminant: 'tiles' as const, value: { perRow: TILES_PER_ROW.fallback } };

/** How a category lists its pieces on the home page; a file without the line keeps the tile grid. */
export const layoutSchema = z
  .discriminatedUnion('discriminant', [
    z.object({ discriminant: z.literal('tiles'), value: z.object({ perRow: tilesPerRow }) }),
    z.object({ discriminant: z.literal('rows'), value: z.object({ images: bool('row images') }) }),
  ])
  .nullish()
  .transform((value) => value ?? defaultLayout)
  .catch((ctx) => {
    warn('layout', ctx.issues);
    return defaultLayout;
  });
export type LayoutData = z.infer<typeof layoutSchema>;

export const categorySchema = z.object({
  name: str(),
  order: z.coerce.number().catch(1),
  hidden: bool('hidden'),
  layout: layoutSchema,
});
export type CategoryData = z.infer<typeof categorySchema>;

/** A missing choice takes the default silently; an unknown one takes it with a warning. */
const rowText = z
  .enum(ROW_TEXTS)
  .nullish()
  .transform((value) => value ?? DEFAULT_ROW_TEXT)
  .catch((ctx) => {
    warn('row text', ctx.issues);
    return DEFAULT_ROW_TEXT;
  });

export const settingsSchema = z.object({
  name: str('Charlotte Rose'),
  tagline: str('writer and editor'),
  description: str(),
});
export type SettingsData = z.infer<typeof settingsSchema>;

export const linkSchema = z.object({ label: str(), url: str() });

export const contactSchema = z.object({
  heading: str('Contact me'),
  intro: str(),
  email: str(),
  links: z.array(linkSchema).catch([]),
});
export type ContactData = z.infer<typeof contactSchema>;

export const homeBaseSchema = z.object({
  statement: str(),
  portraitAlt: str(),
  introduction: str(),
  experience: str(),
  buttonLabel: str('Get in touch'),
});
export type HomeData = z.infer<typeof homeBaseSchema>;

const emptyOutlet = { name: '', url: '' };

const proseValue = z.object({
  outlet: z.object({ name: str(), url: str() }).catch(emptyOutlet),
  body: str(),
});

const poemValue = z.object({
  form: str(),
  poems: z.array(z.object({ title: str(), verse: str() })).catch([]),
});

const paperValue = z.object({
  venue: str(),
  coauthors: str(),
  abstract: str(),
  pdf: str(),
});

export const kindSchema = z
  .discriminatedUnion('discriminant', [
    z.object({ discriminant: z.literal('prose'), value: proseValue }),
    z.object({ discriminant: z.literal('poem'), value: poemValue }),
    z.object({ discriminant: z.literal('paper'), value: paperValue }),
  ])
  .catch((ctx) => {
    warn('kind', ctx.issues);
    return { discriminant: 'prose' as const, value: { outlet: emptyOutlet, body: '' } };
  });
export type KindData = z.infer<typeof kindSchema>;

export const pieceBaseSchema = z.object({
  title: str(),
  kind: kindSchema,
  category: str(),
  date: isoDate(),
  published: bool('published'),
  featured: bool('featured'),
  dek: str(),
  rowText,
  imageAlt: str(),
  openingLines: str(),
  editorsNote: str(),
});
export type PieceData = z.infer<typeof pieceBaseSchema>;
