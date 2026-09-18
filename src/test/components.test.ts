import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { beforeAll, describe, expect, it } from 'vitest';
import Nav from '../components/Nav.astro';
import Footer from '../components/Footer.astro';

let container: AstroContainer;
beforeAll(async () => {
  container = await AstroContainer.create();
});

describe('Nav', () => {
  it('renders the name and both links, underlining only the current page', async () => {
    const html = await container.renderToString(Nav, { props: { name: 'Charlotte Rose', current: 'home' } });
    expect(html).toContain('Charlotte Rose');
    expect(html).toContain('href="/contact/"');
    expect(html.match(/aria-current="page"/g)).toHaveLength(1);
    expect(html).toMatch(/aria-current="page"[^>]*>Home</);
  });

  it('marks nothing current on piece pages', async () => {
    const html = await container.renderToString(Nav, { props: { name: 'Charlotte Rose', band: true } });
    expect(html).not.toContain('aria-current');
    expect(html).toContain('band');
  });
});

describe('Footer', () => {
  it('renders the name, the contact link, and the copyright year', async () => {
    const html = await container.renderToString(Footer, { props: { name: 'Charlotte Rose' } });
    expect(html).toContain('href="/contact/"');
    expect(html).toContain(`© ${new Date().getFullYear()} Charlotte Rose`);
  });
});
