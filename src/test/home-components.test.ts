import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { beforeAll, describe, expect, it } from 'vitest';
import { pieceBaseSchema } from '../lib/schemas';
import { normalizePiece, type CategoryLayout, type FeaturedEntry, type Piece, type Section } from '../lib/pieces';
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
    const html = await container.renderToString(Tile, { props: { piece: p, kind: 'paper', categoryName: 'Essays', perRow: 4 } });
    expect(html).toContain('href="/writing/archive/"');
    expect(html).toContain('tile paper');
    expect(html).toContain('The county keeps its records.');
    expect(html).toMatch(/class="label[^"]*"[^>]*>Essays</);
  });

  it('leaves the category out of the caption, since the section heading names it', async () => {
    const p = piece('archive', { openingLines: 'The county keeps its records.' });
    const html = await container.renderToString(Tile, { props: { piece: p, kind: 'paper', categoryName: 'Essays', perRow: 4 } });
    expect(html).toMatch(/class="caption-meta[^"]*"[^>]*>June 2024</);
  });

  it('keeps grid squares at their full-size type', async () => {
    const p = piece('archive', { openingLines: 'The county keeps its records.' });
    const html = await container.renderToString(Tile, { props: { piece: p, kind: 'paper', categoryName: 'Essays', perRow: 4 } });
    expect(html).toContain('class="tile paper"');
  });

  it('serves an image square at the width its column count gives it', async () => {
    const image = { src: '/img.jpg', width: 1200, height: 1200, format: 'jpg' } as const;
    const p = normalizePiece('spin', { ...pieceBaseSchema.parse({ title: 'Spin', published: true, date: '2024-06-01' }), image });
    const html = await container.renderToString(Tile, { props: { piece: p, kind: 'image', categoryName: 'Poems', perRow: 2 } });
    expect(html).toContain('sizes="(max-width: 639px) calc(50vw - 28px), (max-width: 1023px) calc(50vw - 50px), 484px"');
  });

  it('renders rose and green tiles with the title in the square', async () => {
    const p = piece('three-poems', { kind: { discriminant: 'poem', value: { form: 'free verse', poems: [{ title: '', verse: 'x' }] } } });
    const rose = await container.renderToString(Tile, { props: { piece: p, kind: 'rose', categoryName: 'Poetry', perRow: 4 } });
    const green = await container.renderToString(Tile, { props: { piece: p, kind: 'green', categoryName: 'Poetry', perRow: 4 } });
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
  const section = (layout: CategoryLayout, pieces: Piece[]): Section => ({ slug: 'poetry', name: 'Poetry', uncategorized: false, layout, pieces });
  const render = (s: Section) => container.renderToString(CategorySection, { props: { section: s } });
  const talk = (slug: string, overrides: Record<string, unknown> = {}) =>
    piece(slug, { kind: { discriminant: 'prose', value: { outlet: { name: '', url: '' }, body: '' } }, ...overrides });
  const paper = (slug: string, overrides: Record<string, unknown> = {}) =>
    piece(slug, { kind: { discriminant: 'paper', value: { venue: 'Journal', coauthors: '', abstract: 'We count.', pdf: '/p.pdf' } }, ...overrides });

  it('renders an anchored heading and one tile per piece, alternating plain tiles', async () => {
    const html = await render(section({ kind: 'tiles', perRow: 4 }, [piece('a'), piece('b'), piece('c', { openingLines: 'lines' })]));
    expect(html).toContain('id="poetry"');
    expect(html).toContain('class="category tiles"');
    expect(html.match(/href="\/writing\//g)).toHaveLength(3);
    expect(html).toContain('tile rose');
    expect(html).toContain('tile green');
    expect(html).toContain('tile paper');
  });

  it('sets the column count for each breakpoint on the grid', async () => {
    const html = await render(section({ kind: 'tiles', perRow: 6 }, [piece('a')]));
    expect(html).toMatch(/class="grid"[^>]*style="--columns: 6; --columns-tablet: 3; --columns-phone: 2;"/);
  });

  it('renders a rows section as a list: title, where the piece appeared under it, and the date on the right', async () => {
    const html = await render(
      section({ kind: 'rows', images: false }, [
        talk('remarks', { date: '2025-04-12', openingLines: 'The first thing the water took.' }),
        paper('census', { date: '2024-09-30' }),
      ]),
    );
    expect(html).toContain('class="category rows"');
    expect(html).not.toContain('class="tile');
    expect(html.match(/href="\/writing\//g)).toHaveLength(2);
    expect(html).toMatch(/class="title[^"]*"[^>]*>remarks</);
    expect(html).toMatch(/class="detail meta[^"]*"[^>]*>Journal</);
    expect(html).toMatch(/class="date[^"]*"[^>]*>April 2025</);
    expect(html).toMatch(/class="date[^"]*"[^>]*>2024</);
    expect(html).not.toContain('class="line');
  });

  it('puts the chosen text line between the title and where the piece appeared', async () => {
    const html = await render(
      section({ kind: 'rows', images: false }, [
        paper('census', { rowText: 'description', dek: 'What the payroll forgot.' }),
        talk('remarks', { rowText: 'excerpt', openingLines: 'The first thing the water took.' }),
      ]),
    );
    expect(html).toMatch(/class="title[^"]*"[^>]*>census<\/span><span class="line description[^"]*"[^>]*>What the payroll forgot.<\/span><span class="detail meta[^"]*"[^>]*>Journal</);
    expect(html).toMatch(/class="line lines[^"]*"[^>]*>“The first thing the water took.”</);
    expect(html.match(/class="detail/g)).toHaveLength(1);
  });

  it('leaves both lines out of a row with nothing to say under the title', async () => {
    const html = await render(section({ kind: 'rows', images: false }, [talk('on-reading-aloud')]));
    expect(html).not.toContain('class="line');
    expect(html).not.toContain('class="detail');
  });

  it('adds a square to each row when the category shows images, with the tile fallbacks for pieces without one', async () => {
    const html = await render(section({ kind: 'rows', images: true }, [talk('a'), talk('b', { openingLines: 'lines' }), talk('c')]));
    expect(html.match(/class="thumb [a-z]+"/g)).toEqual(['class="thumb rose"', 'class="thumb paper"', 'class="thumb green"']);
  });

  it('shows no squares when the category keeps images off', async () => {
    const html = await render(section({ kind: 'rows', images: false }, [talk('a')]));
    expect(html).not.toContain('class="thumb');
  });
});
