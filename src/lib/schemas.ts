import { z } from 'astro/zod';

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
  z.boolean().catch((ctx) => {
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

export const categorySchema = z.object({
  name: str(),
  order: z.coerce.number().catch(1),
});
export type CategoryData = z.infer<typeof categorySchema>;

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
  dek: str(),
  imageAlt: str(),
  openingLines: str(),
  editorsNote: str(),
});
export type PieceData = z.infer<typeof pieceBaseSchema>;
