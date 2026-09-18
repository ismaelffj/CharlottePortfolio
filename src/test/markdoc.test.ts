import { describe, expect, it } from 'vitest';
import { renderInline, toPlainText } from '../lib/markdoc';

describe('renderInline', () => {
  it('renders paragraphs and inline emphasis', () => {
    const html = renderInline('Reporting for *The Daily*.\n\nSecond paragraph.');
    expect(html).toContain('<p>Reporting for <em>The Daily</em>.</p>');
    expect(html).toContain('<p>Second paragraph.</p>');
  });

  it('does not wrap the output in an article element', () => {
    expect(renderInline('Just text.')).not.toContain('<article');
  });

  it('renders headings and links', () => {
    const html = renderInline('## A heading\n\n[The Daily](https://example.com)');
    expect(html).toContain('<h2>A heading</h2>');
    expect(html).toContain('<a href="https://example.com">The Daily</a>');
  });

  it('applies typographic quotes', () => {
    const html = renderInline('She said "don\'t".');
    expect(html).toContain('“don’t”');
  });

  it('returns an empty string for empty input', () => {
    expect(renderInline('')).toBe('');
    expect(renderInline('   \n')).toBe('');
  });
});

describe('toPlainText', () => {
  it('strips markup and collapses whitespace', () => {
    expect(toPlainText('## Title\n\nSome *emphasis* and a [link](https://x.y).')).toBe('Title Some emphasis and a link.');
  });

  it('returns an empty string for empty input', () => {
    expect(toPlainText('')).toBe('');
  });
});
