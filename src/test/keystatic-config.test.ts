import { describe, expect, it } from 'vitest';
import config from '../../keystatic.config';

describe('keystatic config', () => {
  it('declares the admin structure from the spec', () => {
    expect(Object.keys(config.singletons ?? {})).toEqual(['home', 'contact', 'settings']);
    expect(Object.keys(config.collections ?? {})).toEqual(['categories', 'pieces']);
  });

  it('uses local storage outside production', () => {
    expect(config.storage.kind).toBe('local');
  });
});
