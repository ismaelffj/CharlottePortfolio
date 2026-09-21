import { describe, expect, it } from 'vitest';
import config from '../../keystatic.config';

describe('keystatic config', () => {
  it('declares the admin structure from the spec', () => {
    expect(Object.keys(config.singletons ?? {})).toEqual(['home', 'contact', 'settings']);
    expect(Object.keys(config.collections ?? {})).toEqual(['categories', 'pieces']);
  });

  it('lets a category be hidden, and shows the flag in the category list', () => {
    const categories = config.collections?.categories;
    expect(Object.keys(categories?.schema ?? {})).toEqual(['name', 'order', 'layout', 'hidden']);
    expect(categories?.columns).toEqual(['order', 'hidden']);
  });

  it('lets a category choose tiles or rows, with the tile count or the images flag under the choice', () => {
    const layout = config.collections?.categories?.schema.layout;
    expect(layout?.kind).toBe('conditional');
    expect(layout?.discriminant.defaultValue()).toBe('tiles');
    expect(layout?.discriminant.options.map((option) => option.value)).toEqual(['tiles', 'rows']);
    expect(Object.keys(layout?.values.tiles.fields ?? {})).toEqual(['perRow']);
    expect(layout?.values.tiles.fields.perRow.defaultValue()).toBe(4);
    expect(() => layout?.values.tiles.fields.perRow.validate(1)).toThrow('at least 2');
    expect(() => layout?.values.tiles.fields.perRow.validate(7)).toThrow('at most 6');
    expect(Object.keys(layout?.values.rows.fields ?? {})).toEqual(['images']);
    expect(layout?.values.rows.fields.images.defaultValue()).toBe(false);
  });

  it('lets a piece be featured, and shows the flag in the writing list', () => {
    const pieces = config.collections?.pieces;
    expect(Object.keys(pieces?.schema ?? {})).toEqual([
      'title', 'kind', 'category', 'date', 'published', 'featured', 'dek', 'rowText', 'image', 'imageAlt', 'openingLines', 'editorsNote',
    ]);
    expect(pieces?.columns).toEqual(['category', 'date', 'published', 'featured']);
  });

  it('lets a piece choose the text line under its title, none by default', () => {
    const rowText = config.collections?.pieces?.schema.rowText;
    expect(rowText?.defaultValue()).toBe('none');
    expect(rowText?.options.map((option) => option.value)).toEqual(['none', 'description', 'excerpt']);
  });

  it('uses local storage outside production', () => {
    expect(config.storage.kind).toBe('local');
  });
});
