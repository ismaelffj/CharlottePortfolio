import { describe, expect, it } from 'vitest';
import { formatMonthYear, formatYear } from '../lib/dates';

describe('dates', () => {
  it('formats month and year in English', () => {
    expect(formatMonthYear(new Date('2024-03-15'))).toBe('March 2024');
  });

  it('formats the year alone', () => {
    expect(formatYear(new Date('2024-03-15'))).toBe('2024');
  });

  it('does not slip a day across the year boundary in any time zone', () => {
    expect(formatMonthYear(new Date('2024-12-31'))).toBe('December 2024');
    expect(formatMonthYear(new Date('2025-01-01'))).toBe('January 2025');
  });
});
