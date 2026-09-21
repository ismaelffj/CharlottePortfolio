import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { beforeAll, describe, expect, it } from 'vitest';
import { pieceBaseSchema } from '../lib/schemas';
import { normalizePiece, type FeaturedEntry, type Section } from '../lib/pieces';
import Row from '../components/Row.astro';
import PillLink from '../components/PillLink.astro';
import Tile from '../components/Tile.astro';
import CategorySection from '../components/CategorySection.astro';
import FeaturedSection from '../components/FeaturedSection.astro';

const piece = (slug: string, overrides: Record<string, unknown> = {}) =>
  normalizePiece(slug, pieceBaseSchema.parse({ title: slug, published: true, date: '2024-06-01', ...overrides }));

let container: AstroContainer;
beforeAll(async () => {
  container = await AstroContainer.create();
});

describe('Row', () => {
  it('renders the label as a heading and the slot as content', async () => {
    const html = await container.renderToString(Row, { props: { label: 'Introduction' }, slots: { default: '<p>Hello</p>' } });
    expect(html).toContain('<h2 class="label');
    expect(html).toContain('Introduction');
    expect(html).toContain('<p>Hello</p>');
  });
});

describe('PillLink', () => {
  it('renders a link with the pill class', async () => {
    const html = await container.renderToString(PillLink, { props: { href: '/contact/', label: 'Get in touch' } });
    expect(html).toMatch(/<a class="pill meta[^"]*" href="\/contact\/"[^>]*>Get in touch<\/a>/);
  });
});

describe('Tile', () => {
  it('renders a paper tile with the category label, title, and opening lines', async () => {
    const p = piece('archive', { openingLines: 'The county keeps its records.' });
    const html = await container.renderToString(Tile, { props: { piece: p, kind: 'paper', categoryName: 'Essays' } });
    expect(html).toContain('href="/writing/archive/"');
    expect(html).toContain('tile paper');
    expect(html).toContain('The county keeps its records.');
    expect(html).toMatch(/class="label[^"]*"[^>]*>Essays</);
  });

  it('leaves the category out of the caption, since the section heading names it', async () => {
    const p = piece('archive', { openingLines: 'The county keeps its records.' });
    const html = await container.renderToString(Tile, { props: { piece: p, kind: 'paper', categoryName: 'Essays' } });
    expect(html).toMatch(/class="caption-meta[^"]*"[^>]*>June 2024</);
  });

  it('keeps grid squares at their full-size type', async () => {
    const p = piece('archive', { openingLines: 'The county keeps its records.' });
    const html = await container.renderToString(Tile, { props: { piece: p, kind: 'paper', categoryName: 'Essays' } });
    expect(html).toContain('class="tile paper"');
  });

  it('renders rose and green tiles with the title in the square', async () => {
    const p = piece('three-poems', { kind: { discriminant: 'poem', value: { form: 'free verse', poems: [{ title: '', verse: 'x' }] } } });
    const rose = await container.renderToString(Tile, { props: { piece: p, kind: 'rose', categoryName: 'Poetry' } });
    const green = await container.renderToString(Tile, { props: { piece: p, kind: 'green', categoryName: 'Poetry' } });
    expect(rose).toContain('tile rose');
    expect(green).toContain('tile green');
    expect(rose).toMatch(/class="caption-meta[^"]*"[^>]*>free verse · 2024</);
  });
});

describe('FeaturedSection', () => {
  const entries: FeaturedEntry[] = [
    { piece: piece('archive', { dek: 'What the county forgot.', openingLines: 'The county keeps its records.' }), categoryName: 'Essays' },
    { piece: piece('three-poems', { kind: { discriminant: 'poem', value: { form: 'free verse', poems: [{ title: '', verse: 'x' }] } } }), categoryName: 'Poetry' },
  ];

  it('renders an anchored Featured heading and one card per entry', async () => {
    const html = await container.renderToString(FeaturedSection, { props: { entries } });
    expect(html).toContain('id="featured"');
    expect(html).toMatch(/<h2[^>]*>Featured<\/h2>/);
    expect(html.match(/href="\/writing\//g)).toHaveLength(2);
  });

  it('names the category in each meta line, since the cards sit outside their sections', async () => {
    const html = await container.renderToString(FeaturedSection, { props: { entries } });
    expect(html).toContain('Essays · June 2024');
    expect(html).toContain('Poetry · free verse · 2024');
  });

  it('shows the dek only when there is one, and reuses the tile fallbacks for the square', async () => {
    const html = await container.renderToString(FeaturedSection, { props: { entries } });
    expect(html).toContain('What the county forgot.');
    expect(html.match(/class="dek/g)).toHaveLength(1);
    expect(html).toContain('tile paper');
    expect(html).toContain('tile rose');
  });

  it('marks the featured squares small, so their fallback type fits a 160px square', async () => {
    const html = await container.renderToString(FeaturedSection, { props: { entries } });
    expect(html.match(/class="tile (paper|rose) small"/g)).toHaveLength(2);
  });
});

describe('CategorySection', () => {
  it('renders an anchored heading and one tile per piece, alternating plain tiles', async () => {
    const section: Section = {
      slug: 'poetry',
      name: 'Poetry',
      uncategorized: false,
      pieces: [piece('a'), piece('b'), piece('c', { openingLines: 'lines' })],
    };
    const html = await container.renderToString(CategorySection, { props: { section } });
    expect(html).toContain('id="poetry"');
    expect(html.match(/href="\/writing\//g)).toHaveLength(3);
    expect(html).toContain('tile rose');
    expect(html).toContain('tile green');
    expect(html).toContain('tile paper');
  });
});
