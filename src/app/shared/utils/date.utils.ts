const MS_PER_DAY = 24 * 60 * 60 * 1000;

/** Formats a date as a local calendar day, `YYYY-MM-DD`. */
export function toIsoDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/** Adds whole days to a `YYYY-MM-DD` date. Negative values move backwards. */
export function addDaysToIsoDate(isoDate: string, days: number): string {
  // A date-time without an offset is parsed as local time.
  const date = new Date(`${isoDate}T00:00:00`);
  date.setDate(date.getDate() + days);
  return toIsoDate(date);
}

/**
 * Number of calendar days from `from` to `to`, ignoring the time of day.
 * Uses UTC midnights so daylight saving changes never produce fractional days.
 */
export function calendarDaysBetween(from: Date, to: Date): number {
  const fromUtc = Date.UTC(from.getFullYear(), from.getMonth(), from.getDate());
  const toUtc = Date.UTC(to.getFullYear(), to.getMonth(), to.getDate());
  return Math.round((toUtc - fromUtc) / MS_PER_DAY);
}
