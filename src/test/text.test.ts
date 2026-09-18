import { describe, expect, it } from 'vitest';
import { excerpt, readingMinutes, smartQuotes } from '../lib/text';

describe('smartQuotes', () => {
  it('curls double quotes', () => {
    expect(smartQuotes('She said "no" and left.')).toBe('She said “no” and left.');
  });

  it('curls apostrophes inside words', () => {
    expect(smartQuotes("don't and what's")).toBe('don’t and what’s');
  });

  it('curls a single-quoted phrase', () => {
    expect(smartQuotes("a 'quiet' room")).toBe('a ‘quiet’ room');
  });

  it('leaves text that is already curly alone', () => {
    const curly = '“don’t”';
    expect(smartQuotes(curly)).toBe(curly);
  });
});

describe('readingMinutes', () => {
  it('rounds words divided by 230, with a minimum of one minute', () => {
    expect(readingMinutes('')).toBe(1);
    expect(readingMinutes('word '.repeat(100))).toBe(1);
    expect(readingMinutes('word '.repeat(460))).toBe(2);
    expect(readingMinutes('word '.repeat(2070))).toBe(9);
  });
});

describe('excerpt', () => {
  it('returns short text unchanged with whitespace collapsed', () => {
    expect(excerpt('  two\n words ')).toBe('two words');
  });

  it('cuts at a word boundary before the limit and adds an ellipsis', () => {
    const text = 'alpha beta gamma delta epsilon';
    expect(excerpt(text, 12)).toBe('alpha beta…');
  });

  it('defaults to 155 characters', () => {
    const long = 'word '.repeat(60).trim();
    const result = excerpt(long);
    expect(result.length).toBeLessThanOrEqual(156);
    expect(result.endsWith('…')).toBe(true);
  });
});
