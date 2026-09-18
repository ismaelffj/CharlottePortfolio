import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { beforeAll, describe, expect, it } from 'vitest';
import PieceHeader from '../components/PieceHeader.astro';
import EditorsNote from '../components/EditorsNote.astro';
import VerseBody from '../components/VerseBody.astro';
import PaperBody from '../components/PaperBody.astro';

let container: AstroContainer;
beforeAll(async () => {
  container = await AstroContainer.create();
});

describe('PieceHeader', () => {
  it('renders label, title, dek, a linked outlet, and dotted items', async () => {
    const html = await container.renderToString(PieceHeader, {
      props: {
        label: 'Reporting',
        title: 'The night shift',
        dek: 'Three months with the crews.',
        meta: { published: { label: 'The Daily', href: 'https://d.example/x' }, items: ['March 2024', '9 min read'] },
      },
    });
    expect(html).toContain('Reporting');
    expect(html).toContain('<h1 class="title');
    expect(html).toContain('Three months with the crews.');
    expect(html).toContain('Originally published in');
    expect(html).toContain('<a href="https://d.example/x"');
    expect(html).toContain('March 2024');
    expect(html).toContain(' · 9 min read');
  });

  it('omits the dek and the published phrase when absent', async () => {
    const html = await container.renderToString(PieceHeader, {
      props: { label: 'Poetry', title: 'Three poems', dek: '', meta: { items: ['free verse', 'June 2024'] } },
    });
    expect(html).not.toContain('Originally published');
    expect(html).not.toContain('class="dek');
    expect(html).toContain('free verse · June 2024');
  });
});

describe('EditorsNote', () => {
  it('renders the label and the note', async () => {
    const html = await container.renderToString(EditorsNote, { props: { text: 'Reported over one winter.' } });
    expect(html).toContain('Editor’s note');
    expect(html).toContain('Reported over one winter.');
  });
});

describe('VerseBody', () => {
  it('keeps line breaks and renders optional titles', async () => {
    const html = await container.renderToString(VerseBody, {
      props: { poems: [{ title: 'What the river took', verse: 'line one\nline two\n\nstanza two' }, { title: '', verse: 'alone' }] },
    });
    expect(html).toContain('<h2 class="poem-title');
    expect(html).toContain('line one\nline two\n\nstanza two');
    expect(html.match(/<h2/g)).toHaveLength(1);
  });
});

describe('PaperBody', () => {
  it('renders the abstract heading, text, and PDF link', async () => {
    const html = await container.renderToString(PaperBody, { props: { abstract: 'We count.', pdf: '/papers/x/paper.pdf' } });
    expect(html).toContain('Abstract');
    expect(html).toContain('We count.');
    expect(html).toContain('href="/papers/x/paper.pdf"');
    expect(html).toContain('Read the full paper (PDF)');
  });
});
