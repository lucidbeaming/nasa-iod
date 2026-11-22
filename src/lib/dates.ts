/**
 * src/lib/dates.ts
 *
 * WHAT: Small helpers for APOD dates: the archive's first day, today's date,
 *       and conversion to the API's legacy `YYMMDD` date codes.
 * WHERE: Used by api/apod.ts (single-day requests) and, from chapter 11, by
 *        the jump-to-date form.
 * CONCEPTS: working with dates as strings, time zones
 * READ MORE: https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Date
 *
 * Every date in this app is a `YYYY-MM-DD` string, never a Date object.
 * APOD dates are calendar days, not moments in time, and Date objects carry a
 * time zone: `new Date('2022-01-15')` is midnight UTC, which is still
 * January 14 for anyone west of Greenwich. Strings compare correctly with
 * `<` and `>`, sort correctly, and can't shift by a day.
 */

/** The first Astronomy Picture of the Day. Nothing exists before it. */
export const ARCHIVE_START = '1995-06-16'

/** A calendar date as `YYYY-MM-DD`. A type alias: documentation, not a check. */
export type IsoDate = string

const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/

/**
 * Today's date in APOD's time zone (US Eastern), as `YYYY-MM-DD`.
 *
 * A new APOD is published around midnight US Eastern time, so "today" for
 * the archive is today in New York, wherever the reader is.
 */
export function todayInArchive(): IsoDate {
  // The 'en-CA' locale formats dates as YYYY-MM-DD.
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/New_York' }).format(new Date())
}

/**
 * True if `date` is a real calendar date within the APOD archive.
 *
 * @param date - a candidate `YYYY-MM-DD` string
 */
export function isArchiveDate(date: string): date is IsoDate {
  const match = ISO_DATE.exec(date)
  if (!match) return false
  const [, y, m, d] = match.map(Number) as [number, number, number, number]
  // Round-trip through Date.UTC to reject dates like 2022-02-30, which
  // Date silently rolls over to March 2.
  const roundTrip = new Date(Date.UTC(y, m - 1, d))
  const valid =
    roundTrip.getUTCFullYear() === y &&
    roundTrip.getUTCMonth() === m - 1 &&
    roundTrip.getUTCDate() === d
  return valid && date >= ARCHIVE_START && date <= todayInArchive()
}

/**
 * Converts `YYYY-MM-DD` to the API's legacy `YYMMDD` date code.
 *
 * The two-digit year is unambiguous only because the archive starts in
 * 1995: `95`–`99` are 1995–1999 and `00`–`94` are 2000–2094.
 *
 * @example toDateCode('2014-09-18') // '140918'
 */
export function toDateCode(date: IsoDate): string {
  return date.slice(2, 4) + date.slice(5, 7) + date.slice(8, 10)
}
