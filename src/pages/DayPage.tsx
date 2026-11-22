/**
 * src/pages/DayPage.tsx
 *
 * WHAT: A permalink for one day (`/day/2026-11-22`).
 * WHERE: Rendered by the `/day/:date` route in main.tsx.
 * CONCEPTS: route parameters, validating URL input, useSuspenseQuery,
 *           per-page metadata
 * READ MORE:
 *   - https://reactrouter.com/start/declarative/url-values
 *   - https://tanstack.com/query/latest/docs/framework/react/reference/useSuspenseQuery
 */
import { useSuspenseQuery } from '@tanstack/react-query'
import { useParams } from 'react-router'
import { plainExplanation } from '../api/apod.ts'
import { dayQuery } from '../api/queries.ts'
import { Entry } from '../components/Entry/Entry.tsx'
import { FeedBoundary } from '../components/Feed/FeedBoundary.tsx'
import { isArchiveDate } from '../lib/dates.ts'
import page from '../styles/page.module.css'
import { NotFoundPage } from './NotFoundPage.tsx'

/** Loads and shows one day's entry. Suspends while loading. */
function Day({ date }: { date: string }) {
  // The single-query version of useSuspenseInfiniteQuery (see Feed.tsx):
  // `entry` is always loaded here. Days already seen in the feed still make
  // one request, because the feed caches pages, not days.
  const { data: entry } = useSuspenseQuery(dayQuery(date))
  return (
    <>
      <title>{`${entry.title} · NASA Image of the Day`}</title>
      {/* The first sentence or so of the explanation, as search engines and
          link previews expect: plain text, about 160 characters. */}
      <meta name="description" content={plainExplanation(entry).slice(0, 160)} />
      <Entry entry={entry} priority />
    </>
  )
}

/** The `/day/:date` page. */
export function DayPage() {
  // useParams returns the URL's dynamic segments. Its values are strings
  // the reader typed (or a link built), so they're input, not data: check
  // before using. A malformed date shouldn't reach the API at all.
  const { date = '' } = useParams()
  if (!isArchiveDate(date)) {
    return <NotFoundPage message={`“${date}” isn’t a date in the APOD archive.`} />
  }
  return (
    <div className={page.page}>
      {/* See the heading note in FeedPage.tsx. */}
      <h2 className="visually-hidden">Picture for {date}</h2>
      {/* The same boundaries as the feed: a skeleton while loading, and a
          message with Try again if it fails (including "no picture for that
          day", the API's 404). */}
      <FeedBoundary>
        <Day date={date} />
      </FeedBoundary>
    </div>
  )
}
