// Content dates are calendar dates stored as YYYY-MM-DD and parsed as UTC
// midnight, so they are formatted in UTC to keep the day they were given.
const monthYear = new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' });
const yearOnly = new Intl.DateTimeFormat('en-US', { year: 'numeric', timeZone: 'UTC' });

export function formatMonthYear(date: Date): string {
  return monthYear.format(date);
}

export function formatYear(date: Date): string {
  return yearOnly.format(date);
}
