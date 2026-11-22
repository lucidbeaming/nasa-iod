/**
 * src/api/queries.ts
 *
 * WHAT: Query keys and query options for TanStack Query: the single place
 *       that says how each piece of server data is fetched, cached and
 *       retried.
 * WHERE: Used by components/Feed/Feed.tsx (the feed), main.tsx (the shared
 *        QueryClient), and from chapter 09 by the day and favorites pages.
 * CONCEPTS: server state, query keys, infinite queries, retry policies
 * READ MORE:
 *   - https://tanstack.com/query/latest/docs/framework/react/guides/infinite-queries
 *   - https://tanstack.com/query/latest/docs/framework/react/guides/query-options
 *
 * 📘 Concept: server state is not component state
 * The 2021 app kept the picture list in useState and wrote its own loading
 * flags, which is how #9 (a spinner stuck forever) and #10 (duplicate
 * requests) happened. Data that lives on a server is different from UI
 * state: someone else owns it, it can go stale, several components may want
 * it, and fetching it can fail halfway. A server-state library handles
 * that once: one cache per *query key*, de-duplicated requests, retries,
 * cancellation, and loading/error status that's always consistent. The
 * components just ask for data.
 */
import {
  QueryClient,
  infiniteQueryOptions,
  queryOptions,
  type InfiniteData,
} from '@tanstack/react-query'
import type { IsoDate } from '../lib/dates.ts'
import { ApiError, fetchApodDay, fetchApodPage, type ApodEntry, type ApodPage } from './apod.ts'

/**
 * Query keys. A key identifies one cache entry: two components using the
 * same key share the same data and the same request. Keys are arrays, from
 * general to specific, so `['apod']` can refer to all APOD data at once
 * (for example to refetch everything).
 */
export const apodKeys = {
  all: ['apod'] as const,
  feed: () => [...apodKeys.all, 'feed'] as const,
  day: (date: IsoDate) => [...apodKeys.all, 'day', date] as const,
}

/**
 * The feed: the archive, one API page at a time, newest first.
 *
 * `infiniteQueryOptions` only bundles the options; it doesn't fetch. Keeping
 * them here (rather than inline in a component) means any component, or a
 * prefetch, can use exactly the same key and fetch function.
 */
export const feedQuery = infiniteQueryOptions({
  queryKey: apodKeys.feed(),

  // TanStack Query passes the page to fetch (`pageParam`) and an AbortSignal
  // that it aborts if the data is no longer needed. Passing the signal on to
  // fetch() is what makes cancellation actually stop the download.
  queryFn: ({ pageParam, signal }) => fetchApodPage(pageParam, signal),

  // Pages are numbered from 1.
  initialPageParam: 1,

  // Called with the last page loaded; returns the next page number, or
  // `undefined` when there is none. `undefined` is what sets hasNextPage to
  // false, which is how the feed knows it has reached the archive's first
  // day (1995-06-16) and stops (#10). The 2021 code had no such check and
  // would have kept requesting dates before the archive began.
  getNextPageParam: (lastPage) =>
    lastPage.page < lastPage.totalPages ? lastPage.page + 1 : undefined,

  // How long fetched data counts as fresh. While fresh, revisiting the feed
  // shows the cache with no request at all. A new APOD appears once a day,
  // so five minutes is generous and still cheap.
  staleTime: 5 * 60 * 1000,

  // `select` reshapes the cached data for the component without changing
  // what's stored. Here: flatten the pages into one list, de-duplicated.
  select: uniqueEntries,
})

/**
 * One day's entry, for the day permalink page and for favorites saved by
 * the 2021 version (which stored only the date).
 *
 * @param date - `YYYY-MM-DD`
 */
export const dayQuery = (date: IsoDate) =>
  queryOptions({
    queryKey: apodKeys.day(date),
    queryFn: ({ signal }) => fetchApodDay(date, signal),
    // A published APOD doesn't change, so once fetched it never goes stale.
    staleTime: Infinity,
  })

/**
 * Flattens loaded pages into a single list with one entry per date.
 *
 * Why duplicates happen: pages are counted from the newest entry. If a new
 * APOD is published while someone is scrolling, every later page shifts by
 * one, and the first entry of the next page is one already shown. Keying
 * by date removes it. (React also needs unique keys; see Feed.tsx.)
 */
export function uniqueEntries(data: InfiniteData<ApodPage, number>): ApodEntry[] {
  const byDate = new Map<string, ApodEntry>()
  for (const page of data.pages) {
    for (const entry of page.entries) {
      if (!byDate.has(entry.date)) byDate.set(entry.date, entry)
    }
  }
  return [...byDate.values()]
}

/**
 * Creates the app's QueryClient, which holds the cache.
 *
 * The retry policy: TanStack Query retries a failed query 3 times by
 * default, with increasing delays. That's right for network blips and 5xx
 * errors, which may succeed on a second try, and wrong for 4xx errors such
 * as "not found", which will fail the same way every time.
 */
export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: (failureCount, error) => {
          if (error instanceof ApiError && error.isClientError) return false
          return failureCount < 3
        },
      },
    },
  })
}
