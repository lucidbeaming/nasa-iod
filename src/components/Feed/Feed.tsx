/**
 * src/components/Feed/Feed.tsx
 *
 * WHAT: The feed. Reads the archive from TanStack Query, page by page, and
 *       asks for the next page when a sentinel after the last entry comes
 *       near the viewport.
 * WHERE: Rendered by App.tsx inside <FeedBoundary>. Renders one <Entry>
 *        per day.
 * CONCEPTS: useSuspenseInfiniteQuery, Suspense, effects that synchronize
 *           with external state, sentinels, live regions
 * READ MORE:
 *   - https://tanstack.com/query/latest/docs/framework/react/reference/useSuspenseInfiniteQuery
 *   - https://react.dev/reference/react/Suspense
 *
 * This replaces src/Main.tsx. Compare the two: about forty lines of loading
 * flags, refs and hand-rolled paging became one hook call, and the bugs that
 * lived in them (#9, #10) have nowhere left to live.
 */
import { useSuspenseInfiniteQuery } from '@tanstack/react-query'
import { useEffect } from 'react'
import { ARCHIVE_START } from '../../lib/dates.ts'
import { feedQuery } from '../../api/queries.ts'
import { useInView } from '../../hooks/useInView.ts'
import { Entry } from '../Entry/Entry.tsx'

/** Props for {@link Feed}. */
interface FeedProps {
  /** Reports the new favorites count up to App. */
  setNewFav: (count: number) => void
}

/** The infinite feed of APOD entries, newest first. */
function Feed({ setNewFav }: FeedProps) {
  // 📘 Concept: Suspense (see FeedBoundary.tsx for the full picture)
  // The "suspense" version of the hook never returns while the first page is
  // loading. It suspends instead, and React shows the nearest <Suspense
  // fallback> until the data is ready. If the first page fails, the hook
  // throws, and the nearest error boundary takes over. So below this line,
  // `entries` is always loaded data: there's no `isLoading` or `isError`
  // branch to write, and no way to render an empty list by mistake.
  //
  // `data` is whatever `select` in feedQuery returns: here, a flat list
  // with one entry per date.
  const {
    data: entries,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isFetchNextPageError,
    error,
  } = useSuspenseInfiniteQuery(feedQuery)

  // The sentinel is an empty element after the last entry. `nearBottom` is
  // true while it's within two screen heights of the viewport (see
  // useInView.ts for why this replaced App's scroll listener).
  const [sentinelRef, nearBottom] = useInView('0px 0px 200% 0px')

  // Ask for the next page while the bottom is near, there is a next page,
  // and none is already on its way. This effect *synchronizes* the query with
  // what the observer reports, which is what effects are for. Every value it
  // reads is in the dependency array, so it re-checks whenever any of them changes: after a
  // page arrives (isFetchingNextPage flips back to false), it loads another
  // if the user is still near the bottom.
  //
  // ⚠️ Common mistake (from v0-2021, src/Main.js):
  //   useLayoutEffect(() => { if (props.triggered) callNASA(criteria) }, [props.triggered])
  // (`triggered` was App's "near the bottom" flag, now `nearBottom`.)
  // With nothing checking whether a request was already running, a second
  // trigger could request the same range twice (#10). isFetchingNextPage is
  // that check, and TanStack Query also de-duplicates calls to fetchNextPage
  // made while a page is in flight.
  //
  // ⚠️ Common mistake (found while writing this chapter):
  //   if (triggered && hasNextPage && !isFetchingNextPage) fetchNextPage()
  // When a page fails, isFetchingNextPage flips back to false while the user
  // is still at the bottom, so the effect immediately asks again, and again:
  // a test with a stubbed 404 made 17,057 requests in a few seconds. An
  // effect that starts work must also know when to *stop*. After a failed
  // page, nothing loads until the user presses "Try again" below.
  useEffect(() => {
    if (nearBottom && hasNextPage && !isFetchingNextPage && !isFetchNextPageError) {
      void fetchNextPage()
    }
  }, [nearBottom, hasNextPage, isFetchingNextPage, isFetchNextPageError, fetchNextPage])

  return (
    <div id="main">
      <div id="main-block">
        {entries.map((entry, i) => (
          // ⚠️ Common mistake (from v0-2021, src/ImageBlock.js):
          //   props.imageList.map((image_item, index) => <Image key={index} … />)
          // A key tells React which item is which between renders. An index
          // describes a *position*, so if items are ever inserted or removed,
          // React pairs the wrong component state (an expanded caption, a
          // playing video) with the wrong day. Each APOD has a unique date,
          // which identifies the *item* (#12). De-duplication by date in
          // api/queries.ts is what makes it safe to use as the key.
          <Entry key={entry.date} entry={entry} priority={i === 0} setNewFav={setNewFav} />
        ))}
      </div>

      {/* 📘 Concept: live regions
          Sighted readers see the spinner; screen reader users need words. An
          element with role="status" is a *polite live region*: when its text
          changes, screen readers announce the new text at the next pause,
          without moving focus. It must be in the page before its text
          changes (a region that appears already filled is often not
          announced), so it's always rendered, and only its text varies. */}
      <p className="visually-hidden" role="status">
        {isFetchingNextPage ? 'Loading earlier pictures…' : ''}
      </p>

      {isFetchNextPageError ? (
        // A failed *later* page keeps everything already loaded on screen,
        // so it gets an inline message rather than the error boundary.
        // (A failed *first* page has nothing to show; it's thrown to the
        // boundary in FeedBoundary.tsx.) fetchNextPage() retries the page.
        <div className="iod-error" role="alert">
          <p>Couldn’t load earlier pictures: {error?.message}</p>
          <button type="button" onClick={() => void fetchNextPage()}>
            Try again
          </button>
        </div>
      ) : hasNextPage ? (
        // The loader doubles as the sentinel. It's only rendered while
        // there's more to load, so the observer stops with it.
        <div ref={sentinelRef} className={`iod-loader${isFetchingNextPage ? ' active' : ''}`}></div>
      ) : (
        <p className="iod-end">
          You’ve reached the first Astronomy Picture of the Day ({ARCHIVE_START}).
        </p>
      )}
    </div>
  )
}

export default Feed
