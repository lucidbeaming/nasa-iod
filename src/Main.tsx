/**
 * src/Main.tsx
 *
 * WHAT: Fetches pictures one page at a time and keeps the growing list.
 * WHERE: Rendered by App.tsx, which sets `triggered` when the user nears the
 *        bottom of the page. Renders <Imageblock> with the list.
 * CONCEPTS: a custom hook, fetch in an event-driven effect, useRef as a counter
 * READ MORE: https://react.dev/learn/reusing-logic-with-custom-hooks
 *
 * Chapter 03 changed only *what* this file requests: pages from the APOD
 * Basic API (api/apod.ts) instead of date ranges from the retired
 * api.nasa.gov endpoint. *How* it requests is still the 2021 loading-flag
 * logic, which chapter 04 replaces with TanStack Query.
 */
import { useLayoutEffect, useRef, useState } from 'react'
import { fetchApodPage, type ApodEntry } from './api/apod.ts'
import Imageblock from './ImageBlock.tsx'

/**
 * Fetches one page of the archive.
 *
 * @returns the latest page's entries, whether a request is in flight, and a
 *          function that starts a request for a page number.
 */
function useNasaImages() {
  const [imageUpdate, setImageUpdate] = useState<ApodEntry[]>([])
  const [loading, setLoading] = useState(false)

  const callNASA = (page: number) => {
    setLoading(true)
    // The API returns newest first, so the 2021 `.reverse()` is gone.
    fetchApodPage(page)
      .then((result) => setImageUpdate(result.entries))
      .then(() => setLoading(false))
      // Known bug (#9): the client now throws a typed ApiError for failed
      // requests (fixed in chapter 03), but this catch still only logs, so
      // `loading` stays true and the spinner never stops. Chapter 06 moves
      // errors into an error boundary with a Retry button.
      .catch((error: unknown) => console.log('fetch error', error))
  }
  return [imageUpdate, loading, callNASA] as const
}

/** Props for {@link Main}. */
interface MainProps {
  /** True while the bottom of the page is near the viewport. */
  triggered: boolean
  /** Reports the new favorites count up to App. */
  setNewFav: (count: number) => void
}

/** The feed: fetches page after page of pictures as `triggered` fires. */
function Main(props: MainProps) {
  // useRef holds a value that survives re-renders without causing one.
  // `initializing` is a "has the first fetch started?" flag, and `nextPage`
  // counts pages: neither is shown on screen, so neither needs to be state.
  const initializing = useRef(true)
  const nextPage = useRef(1)
  const [allImages, setAllImages] = useState<ApodEntry[]>([])
  const [imageUpdate, loading, callNASA] = useNasaImages()

  // Runs whenever `loading` flips: starts the first fetch, then appends each
  // response to the list once loading finishes. Driving data flow from a
  // loading flag like this is fragile (see #9, #10); chapter 04 replaces it
  // with a query library built for exactly this job.
  useLayoutEffect(() => {
    if (initializing.current && !allImages.length) {
      initializing.current = false
      callNASA(nextPage.current++)
    }
    if (!initializing.current && !allImages.length && !loading) {
      setAllImages(imageUpdate)
    } else if (!initializing.current && allImages.length && !loading) {
      setAllImages(allImages.concat(imageUpdate))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading])

  // Fetch the next page when App reports the user is near the bottom.
  // Known bug (#10): nothing stops at the last page or prevents a second
  // request while one is in flight. Chapter 04 fixes both.
  useLayoutEffect(() => {
    if (props.triggered && allImages.length) {
      callNASA(nextPage.current++)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.triggered])

  return (
    <div id="main">
      <Imageblock imageList={allImages} setNewFav={props.setNewFav} />
      <div className={`iod-loader${loading || props.triggered ? ' active' : ''}`}></div>
    </div>
  )
}

export default Main
