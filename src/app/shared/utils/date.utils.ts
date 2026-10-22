const MS_PER_DAY = 24 * 60 * 60 * 1000;

/** Formats a date as a local calendar day, `YYYY-MM-DD`. */
export function toIsoDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/** Parses a `YYYY-MM-DD` date as local midnight. */
export function fromIsoDate(isoDate: string): Date {
  // A date-time without an offset is parsed as local time.
  return new Date(`${isoDate}T00:00:00`);
}

/** Adds whole days to a `YYYY-MM-DD` date. Negative values move backwards. */
export function addDaysToIsoDate(isoDate: string, days: number): string {
  const date = fromIsoDate(isoDate);
  date.setDate(date.getDate() + days);
  return toIsoDate(date);
}

/**
 * Adds whole months to a `YYYY-MM-DD` date, keeping the day where the month allows it:
 * January 31 plus one month is the last day of February.
 */
export function addMonthsToIsoDate(isoDate: string, months: number): string {
  const date = fromIsoDate(isoDate);
  const day = date.getDate();
  date.setDate(1);
  date.setMonth(date.getMonth() + months);
  const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  date.setDate(Math.min(day, lastDay));
  return toIsoDate(date);
}

/** First day of the month of a `YYYY-MM-DD` date. */
export function startOfMonth(isoDate: string): string {
  return `${isoDate.slice(0, 8)}01`;
}

/** First day of the week of a `YYYY-MM-DD` date; weeks start on `weekStartsOn` (0 is Sunday). */
export function startOfWeek(isoDate: string, weekStartsOn = 1): string {
  const offset = (fromIsoDate(isoDate).getDay() - weekStartsOn + 7) % 7;
  return addDaysToIsoDate(isoDate, -offset);
}

/** Whether a value is a real calendar day written as `YYYY-MM-DD`. */
export function isIsoDate(value: string | null | undefined): value is string {
  return !!value && /^\d{4}-\d{2}-\d{2}$/.test(value) && toIsoDate(fromIsoDate(value)) === value;
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
