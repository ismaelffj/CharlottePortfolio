import { describe, expect, it } from 'vitest';
import { canonicalUrl, pageTitle } from '../lib/site';

const settings = { name: 'Charlotte Rose', tagline: 'writer and editor' };

describe('pageTitle', () => {
  it('uses name and tagline for the home page', () => {
    expect(pageTitle(settings)).toBe('Charlotte Rose, writer and editor');
  });

  it('puts the page title before the name elsewhere', () => {
    expect(pageTitle(settings, 'Three poems')).toBe('Three poems · Charlotte Rose');
  });
});

describe('canonicalUrl', () => {
  it('joins the site origin and adds a trailing slash', () => {
    expect(canonicalUrl('/writing/x', new URL('https://example.com'))).toBe('https://example.com/writing/x/');
    expect(canonicalUrl('/', new URL('https://example.com'))).toBe('https://example.com/');
  });

  it('falls back to localhost when no site is configured', () => {
    expect(canonicalUrl('/contact/', undefined)).toBe('http://localhost:4877/contact/');
  });
});
