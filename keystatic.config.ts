/// <reference types="astro/client" />
import { collection, config, fields, singleton } from '@keystatic/core';
import { TILES_PER_ROW } from './src/lib/layout';

// Rich text for short passages: paragraphs, bold, italic, links. Nothing else.
const passage = (label: string, description?: string) =>
  fields.markdoc.inline({
    label,
    description,
    options: {
      heading: false,
      blockquote: false,
      orderedList: false,
      unorderedList: false,
      table: false,
      image: false,
      divider: false,
      codeBlock: false,
      code: false,
      strikethrough: false,
    },
  });

// Rich text for article and essay bodies.
const proseBody = fields.markdoc.inline({
  label: 'Body',
  options: {
    heading: [2, 3],
    table: false,
    image: false,
    codeBlock: false,
    code: false,
    strikethrough: false,
  },
});

const optionalText = (label: string, description?: string) =>
  fields.text({ label, description });

// The slug becomes the entry's folder name, and the Vite dev server refuses paths with a colon in them,
// so the admin only accepts the lowercase, hyphenated form its own generator produces.
const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const slugRules = (source: 'name' | 'title', entry: 'category' | 'piece') => ({
  description: `Made from the ${source}. Leave this alone after creating the ${entry}.`,
  validation: {
    pattern: {
      regex: SLUG_PATTERN,
      message: `Lowercase letters, numbers, and hyphens only. Press Regenerate to make it from the ${source}.`,
    },
  },
});

export default config({
  storage: import.meta.env.DEV ? { kind: 'local' } : { kind: 'cloud' },
  cloud: { project: 'dreamwell/charlotte-portfolio' },
  ui: {
    brand: { name: 'Charlotte Rose' },
    navigation: {
      Content: ['home', 'contact', 'settings'],
      Writing: ['pieces', 'categories'],
    },
  },
  singletons: {
    home: singleton({
      label: 'Home page',
      path: 'src/content/home/',
      format: { data: 'yaml' },
      schema: {
        statement: fields.text({
          label: 'Statement',
          description: 'One sentence, 70 characters or fewer, no line breaks.',
          validation: { isRequired: true },
        }),
        portrait: fields.image({ label: 'Portrait', validation: { isRequired: true } }),
        portraitAlt: fields.text({
          label: 'Portrait description',
          description: 'Describe the photo for people who can’t see it.',
          validation: { isRequired: true },
        }),
        introduction: passage('Introduction'),
        experience: passage('Experience', 'What you have written and where, not a job history.'),
        buttonLabel: fields.text({ label: 'Button label', defaultValue: 'Get in touch' }),
      },
    }),
    contact: singleton({
      label: 'Contact page',
      path: 'src/content/contact/',
      format: { data: 'yaml' },
      schema: {
        heading: fields.text({ label: 'Heading', defaultValue: 'Contact me' }),
        intro: passage('Intro (optional)', 'One or two sentences above the contact details.'),
        email: fields.text({ label: 'Email', validation: { isRequired: true } }),
        links: fields.array(
          fields.object({
            label: fields.text({ label: 'Label' }),
            url: fields.url({ label: 'Link' }),
          }),
          { label: 'Links', itemLabel: (props) => props.fields.label.value || 'Link' },
        ),
      },
    }),
    settings: singleton({
      label: 'Site settings',
      path: 'src/content/settings/',
      format: { data: 'yaml' },
      schema: {
        name: fields.text({ label: 'Name', defaultValue: 'Charlotte Rose' }),
        tagline: fields.text({ label: 'Tagline', defaultValue: 'writer and editor' }),
        description: fields.text({
          label: 'One-line description',
          description: 'Shown in search results and link previews.',
          validation: { isRequired: true },
        }),
      },
    }),
  },
  collections: {
    categories: collection({
      label: 'Categories',
      slugField: 'name',
      path: 'src/content/categories/*/',
      format: { data: 'yaml' },
      columns: ['order', 'hidden'],
      schema: {
        name: fields.slug({
          name: { label: 'Name' },
          slug: slugRules('name', 'category'),
        }),
        order: fields.integer({
          label: 'Order',
          description:
            'Lower numbers appear first on the home page. Deleting a category does not delete its pieces; they move to an Uncategorized section until you give them a new category.',
          defaultValue: 1,
          validation: { isRequired: true },
        }),
        layout: fields.conditional(
          fields.select({
            label: 'Layout',
            description: 'Tiles show a square for each piece. Rows list the pieces one under another, with the date on the right.',
            defaultValue: 'tiles',
            options: [
              { label: 'Tiles', value: 'tiles' },
              { label: 'Rows', value: 'rows' },
            ],
          }),
          {
            tiles: fields.object({
              perRow: fields.integer({
                label: 'Tiles per row',
                description: 'How many tiles sit side by side on a desktop screen. Tablets show at most three, phones two.',
                defaultValue: TILES_PER_ROW.fallback,
                validation: { isRequired: true, min: TILES_PER_ROW.min, max: TILES_PER_ROW.max },
              }),
            }),
            rows: fields.object({
              images: fields.checkbox({
                label: 'Show images',
                defaultValue: false,
                description:
                  'Shows each piece’s image as a small square at the start of its row. Pieces without an image get a plain rose or green square.',
              }),
            }),
          },
        ),
        hidden: fields.checkbox({
          label: 'Hidden',
          defaultValue: false,
          description: 'Takes this category and all of its pieces off the site until you untick it. Nothing is deleted.',
        }),
      },
    }),
    pieces: collection({
      label: 'Writing',
      slugField: 'title',
      path: 'src/content/pieces/*/',
      format: { data: 'yaml' },
      columns: ['category', 'date', 'published', 'featured'],
      schema: {
        title: fields.slug({
          name: { label: 'Title' },
          slug: slugRules('title', 'piece'),
        }),
        kind: fields.conditional(
          fields.select({
            label: 'Kind',
            description: 'Decides the layout. Category decides where it appears on the home page.',
            defaultValue: 'prose',
            options: [
              { label: 'Article or essay', value: 'prose' },
              { label: 'Poem', value: 'poem' },
              { label: 'Research paper', value: 'paper' },
            ],
          }),
          {
            prose: fields.object({
              outlet: fields.object(
                {
                  name: optionalText('Outlet'),
                  url: fields.url({ label: 'Link' }),
                },
                { label: 'Originally published in (optional)' },
              ),
              body: proseBody,
            }),
            poem: fields.object({
              form: optionalText('Form (optional)', 'For example free verse, sonnet, prose poem.'),
              poems: fields.array(
                fields.object({
                  title: optionalText('Title (optional)'),
                  verse: fields.text({
                    label: 'Poem',
                    multiline: true,
                    description: 'Line breaks and blank lines are kept exactly as typed.',
                  }),
                }),
                {
                  label: 'Poems',
                  itemLabel: (props) => props.fields.title.value || 'Untitled',
                  validation: { length: { min: 1 } },
                },
              ),
            }),
            paper: fields.object({
              venue: fields.text({ label: 'Venue', validation: { isRequired: true } }),
              coauthors: optionalText('Co-authors (optional)', 'For example: With J. Ortiz and M. Lee.'),
              abstract: fields.text({ label: 'Abstract', multiline: true, validation: { isRequired: true } }),
              pdf: fields.file({
                label: 'PDF',
                directory: 'public/papers',
                publicPath: '/papers/',
                validation: { isRequired: true },
              }),
            }),
          },
        ),
        category: fields.relationship({
          label: 'Category',
          collection: 'categories',
          validation: { isRequired: true },
        }),
        date: fields.date({ label: 'Date', defaultValue: { kind: 'today' }, validation: { isRequired: true } }),
        published: fields.checkbox({
          label: 'Published',
          defaultValue: false,
          description: 'Unpublished pieces are hidden from the site.',
        }),
        featured: fields.checkbox({
          label: 'Featured',
          defaultValue: false,
          description: 'Shows the piece in the Featured section of the home page, above the categories. Two work best.',
        }),
        dek: optionalText('One-line description (optional)', 'Shown under the title on the piece page.'),
        extraLine: fields.select({
          label: 'Extra line',
          description:
            'An extra line under the title on the home page, in a tile caption or a row, above the venue, outlet, or form. Opening of the text shows the opening lines you typed, or, when that field is empty, the first 155 characters of the abstract, body, or poem.',
          defaultValue: 'none',
          options: [
            { label: 'None', value: 'none' },
            { label: 'One-line description', value: 'description' },
            { label: 'Opening of the text', value: 'excerpt' },
          ],
        }),
        image: fields.image({
          label: 'Image (optional)',
          description: 'At least 1200 by 1200 pixels and under 3MB. The site crops it to a square.',
        }),
        imageAlt: optionalText(
          'Image description (optional)',
          'For people who can’t see the image. Leave empty if the image is decorative.',
        ),
        openingLines: fields.text({
          label: 'Opening lines (optional)',
          multiline: true,
          description: 'Two or three lines, shown on the tile when there is no image.',
        }),
        editorsNote: fields.text({
          label: 'Editor’s note (optional)',
          multiline: true,
          description: '60 words or fewer. Why this piece is in the portfolio.',
        }),
      },
    }),
  },
});
