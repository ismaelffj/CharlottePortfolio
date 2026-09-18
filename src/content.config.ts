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

const single = (name: string) => glob({ pattern: `${name}/index.yaml`, base: './src/content' });

// An empty or malformed image value renders as "no image" with a warning.
// A value that names a file which does not exist still fails the build:
// Astro resolves image files after parsing, outside this schema.
const tolerantImage = (image: SchemaContext['image'], field: string) =>
  z.preprocess(relativeImagePath, image().nullable()).catch((ctx) => {
    console.warn(`[content] ${field}: ${ctx.issues.map((issue) => issue.message).join('; ')}. Rendering without it.`);
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
