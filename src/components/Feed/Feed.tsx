/**
 * src/components/Feed/Feed.tsx
 *
 * WHAT: The feed. Reads the archive from TanStack Query, page by page, and
 *       asks for the next page when App reports the user is near the bottom.
 * WHERE: Rendered by App.tsx inside a <Suspense> boundary. Renders
 *        <Imageblock> with the de-duplicated list.
 * CONCEPTS: useSuspenseInfiniteQuery, Suspense (first look), effects that
 *           synchronize with props
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
import Imageblock from '../../ImageBlock.tsx'

/** Props for {@link Feed}. */
interface FeedProps {
  /** True while the bottom of the page is near the viewport (chapter 05 replaces this). */
  triggered: boolean
  /** Reports the new favorites count up to App. */
  setNewFav: (count: number) => void
}

/** The infinite feed of APOD entries, newest first. */
function Feed({ triggered, setNewFav }: FeedProps) {
  // 📘 Concept: Suspense (first look; chapter 06 covers it fully)
  // The "suspense" version of the hook never returns while the first page is
  // loading. It suspends instead, and React shows the nearest <Suspense
  // fallback> (in App.tsx) until the data is ready. So below this line,
  // `entries` is always loaded data: there is no `isLoading` branch to
  // write, and no way to render an empty list by mistake.
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

  // Ask for the next page while the bottom is near, there is a next page,
  // and none is already on its way. This effect *synchronizes* the query with
  // a prop, which is what effects are for. Every value it reads is in the
  // dependency array, so it re-checks whenever any of them changes: after a
  // page arrives (isFetchingNextPage flips back to false), it loads another
  // if the user is still near the bottom.
  //
  // ⚠️ Common mistake (from v0-2021, src/Main.js):
  //   useLayoutEffect(() => { if (props.triggered) callNASA(criteria) }, [props.triggered])
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
  // page, nothing loads until the user asks (chapter 06 adds a Retry button).
  useEffect(() => {
    if (triggered && hasNextPage && !isFetchingNextPage && !isFetchNextPageError) {
      void fetchNextPage()
    }
  }, [triggered, hasNextPage, isFetchingNextPage, isFetchNextPageError, fetchNextPage])

  return (
    <div id="main">
      <Imageblock imageList={entries} setNewFav={setNewFav} />
      {isFetchNextPageError ? (
        // A failed *later* page keeps everything already loaded on screen.
        // (A failed *first* page has nothing to show; it's thrown to the
        // nearest error boundary, which chapter 06 adds.)
        <p className="iod-end" role="alert">
          Couldn’t load earlier pictures: {error?.message}
        </p>
      ) : hasNextPage ? (
        <div className={`iod-loader${isFetchingNextPage ? ' active' : ''}`}></div>
      ) : (
        <p className="iod-end">
          You’ve reached the first Astronomy Picture of the Day ({ARCHIVE_START}).
        </p>
      )}
    </div>
  )
}

export default Feed
