import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { beforeAll, describe, expect, it } from 'vitest';
import { pieceBaseSchema } from '../lib/schemas';
import { normalizePiece, type Section } from '../lib/pieces';
import Row from '../components/Row.astro';
import PillLink from '../components/PillLink.astro';
import Tile from '../components/Tile.astro';
import CategorySection from '../components/CategorySection.astro';

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
    expect(html).toContain('Essays · June 2024');
  });

  it('renders rose and green tiles with the title in the square', async () => {
    const p = piece('three-poems', { kind: { discriminant: 'poem', value: { form: 'free verse', poems: [{ title: '', verse: 'x' }] } } });
    const rose = await container.renderToString(Tile, { props: { piece: p, kind: 'rose', categoryName: 'Poetry' } });
    const green = await container.renderToString(Tile, { props: { piece: p, kind: 'green', categoryName: 'Poetry' } });
    expect(rose).toContain('tile rose');
    expect(green).toContain('tile green');
    expect(rose).toContain('Poetry · free verse · 2024');
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
