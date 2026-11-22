/**
 * src/components/Entry/DateStamp.tsx
 *
 * WHAT: The calendar-page date stamp beside each entry (month, day, year).
 * WHERE: Used by Entry.tsx.
 * CONCEPTS: deriving display values during render, <time>, Intl.DateTimeFormat
 * READ MORE:
 *   - https://developer.mozilla.org/docs/Web/HTML/Element/time
 *   - https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat
 */
import type { IsoDate } from '../../lib/dates.ts'

// Formatters are built once, at module level, and reused for every stamp.
// timeZone: 'UTC' matters: a `YYYY-MM-DD` string parses as midnight UTC,
// and formatting it in a time zone west of Greenwich would show the day
// before (see the note on dates in lib/dates.ts).
const month = new Intl.DateTimeFormat('en-US', { month: 'short', timeZone: 'UTC' })
const full = new Intl.DateTimeFormat('en-US', { dateStyle: 'long', timeZone: 'UTC' })

/** Calendar-style stamp for an APOD date. */
export function DateStamp({ date }: { date: IsoDate }) {
  // Derived values are computed during render, not stored in state. There's
  // nothing to keep in sync: the stamp is a pure function of `date`.
  const d = new Date(date)
  return (
    // <time dateTime> gives the machine-readable date; aria-label gives
    // screen readers "November 22, 2026" instead of "NOV 22 2026" read as
    // three separate words.
    <time className="calendar-stamp" dateTime={date} aria-label={full.format(d)}>
      <span className="month" aria-hidden="true">
        {month.format(d)}
      </span>
      <span className="day" aria-hidden="true">
        {d.getUTCDate()}
      </span>
      <span className="year" aria-hidden="true">
        {d.getUTCFullYear()}
      </span>
    </time>
  )
}
