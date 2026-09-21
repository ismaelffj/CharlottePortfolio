import { describe, expect, it } from 'vitest';
import config from '../../keystatic.config';

describe('keystatic config', () => {
  it('declares the admin structure from the spec', () => {
    expect(Object.keys(config.singletons ?? {})).toEqual(['home', 'contact', 'settings']);
    expect(Object.keys(config.collections ?? {})).toEqual(['categories', 'pieces']);
  });

  it('lets a category be hidden, and shows the flag in the category list', () => {
    const categories = config.collections?.categories;
    expect(Object.keys(categories?.schema ?? {})).toEqual(['name', 'order', 'hidden']);
    expect(categories?.columns).toEqual(['order', 'hidden']);
  });

  it('lets a piece be featured, and shows the flag in the writing list', () => {
    const pieces = config.collections?.pieces;
    expect(Object.keys(pieces?.schema ?? {})).toEqual([
      'title', 'kind', 'category', 'date', 'published', 'featured', 'dek', 'image', 'imageAlt', 'openingLines', 'editorsNote',
    ]);
    expect(pieces?.columns).toEqual(['category', 'date', 'published', 'featured']);
  });

  it('uses local storage outside production', () => {
    expect(config.storage.kind).toBe('local');
  });
});
