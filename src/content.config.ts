import { defineCollection, type SchemaContext } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';
import {
  categorySchema,
  contactSchema,
  homeBaseSchema,
  pieceBaseSchema,
  relativeImagePath,
  settingsSchema,
} from './lib/schemas';

// Astro clears its content store only when this file's text changes; a file whose contents are
// unchanged is otherwise served from the store as it was last parsed, even after the schemas in
// ./lib/schemas change shape or the file moves to another folder (the entry keeps its old path and
// its images go missing). When a schema gains a field or entries are moved on disk, change this
// file too (this comment is enough) so every entry is parsed again, locally and in the cached
// production build.
// Content revision: 2026-09-21 (3), the piece row text renamed to extra line.

const single = (name: string) => glob({ pattern: `${name}/index.yaml`, base: './src/content' });

// An empty or malformed image value renders as "no image" with a warning.
// A value that names a file which does not exist still fails the build:
// Astro resolves image files after parsing, outside this schema.
const tolerantImage = (image: SchemaContext['image'], field: string) =>
  z.preprocess(relativeImagePath, image().nullable()).catch((ctx) => {
    console.warn(`[content] ${field}: ${ctx.issues.map((issue) => issue.message ?? issue.code).join('; ')}. Rendering without it.`);
    return null;
  });

export const collections = {
  home: defineCollection({
    loader: single('home'),
    schema: ({ image }) => homeBaseSchema.extend({ portrait: tolerantImage(image, 'home portrait') }),
  }),
  contact: defineCollection({ loader: single('contact'), schema: contactSchema }),
  settings: defineCollection({ loader: single('settings'), schema: settingsSchema }),
  categories: defineCollection({
    loader: glob({ pattern: '*/index.yaml', base: './src/content/categories' }),
    schema: categorySchema,
  }),
  pieces: defineCollection({
    loader: glob({ pattern: '*/index.yaml', base: './src/content/pieces' }),
    schema: ({ image }) => pieceBaseSchema.extend({ image: tolerantImage(image, 'piece image') }),
  }),
};
