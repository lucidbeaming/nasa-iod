/**
 * src/Main.tsx
 *
 * WHAT: Fetches pictures one week at a time and keeps the growing list.
 * WHERE: Rendered by App.tsx, which sets `triggered` when the user nears the
 *        bottom of the page. Renders <Imageblock> with the list.
 * CONCEPTS: a custom hook, fetch in an event-driven effect, useRef as a flag
 * READ MORE: https://react.dev/learn/reusing-logic-with-custom-hooks
 *
 * Ported from 2021 without behavior changes. This is the file the rewrite
 * replaces most completely: chapter 03 adds a typed API client, chapter 04
 * moves the list into TanStack Query, and chapter 06 handles errors (#9).
 */
import { useLayoutEffect, useRef, useState } from 'react'
import Imageblock from './ImageBlock.tsx'
import type { ApodItem } from './types.ts'

// 📘 Concept: environment variables in Vite
// Vite exposes variables that start with VITE_ (from .env files or the
// shell) on `import.meta.env`, and writes their values into the bundle at
// build time. Anything bundled is visible to every visitor, so a VITE_
// variable is configuration, never a secret. (Create React App did the same
// with REACT_APP_ variables on `process.env`.)
const apiKey: string | undefined = import.meta.env.VITE_NASA_API_KEY

/** Start and end dates for one API request, `YYYY-MM-DD`. */
interface DateRange {
  start: string
  end: string
}

/**
 * Fetches one date range from the APOD API.
 *
 * @returns the latest response, whether a request is in flight, and a
 *          function that starts a request for `param`.
 */
function useNasaImages(param: DateRange) {
  const [imageUpdate, setImageUpdate] = useState<ApodItem[]>([])
  const [loading, setLoading] = useState(false)

  const callNASA = () => {
    setLoading(true)
    const criteria = 'start_date=' + param.start + '&end_date=' + param.end
    const nasaQuery = 'https://api.nasa.gov/planetary/apod?' + criteria + '&api_key=' + apiKey
    fetch(nasaQuery)
      // Known bug (#9): `res.ok` is never checked, so an error response is
      // parsed as if it were data.
      .then((res) => res.json() as Promise<ApodItem[]>)
      .then((res) => res.reverse())
      .then(setImageUpdate)
      .then(() => setLoading(false))
      // Known bug (#9): on failure, `loading` stays true forever, so the
      // spinner never stops and no further pages load.
      .catch((error: unknown) => console.log('fetch error', error))
  }
  return [imageUpdate, loading, callNASA] as const
}

/**
 * Computes the next 7-day window to request, counting back from today by
 * the number of pictures already loaded.
 *
 * Known bug (#10): this assumes one picture per loaded day, but video days
 * are dropped from the list (#11), so after a video the window can overlap
 * a week that's already loaded.
 */
const dateRange = (imageCount: number): [string, string] => {
  const endOffset = imageCount ? 1 : 0
  const dayMultiple = 1000 * 60 * 60 * 24
  const offset = new Date()
  let end: Date
  if (imageCount > 0) {
    end = new Date(offset.getTime())
  } else {
    end = new Date(offset.getTime() - offset.getTimezoneOffset() * 60000)
  }
  const endTime = end.getTime() - (imageCount + endOffset) * dayMultiple
  const startTime = endTime - 6 * dayMultiple
  // toISOString() always returns `YYYY-MM-DDTHH:mm:ss.sssZ`, so the date part
  // is always present; the `?? ''` only satisfies noUncheckedIndexedAccess.
  const startDate = new Date(startTime).toISOString().split('T')[0] ?? ''
  const endDate = new Date(endTime).toISOString().split('T')[0] ?? ''
  return [startDate, endDate]
}

/** Props for {@link Main}. */
interface MainProps {
  /** True while the bottom of the page is near the viewport. */
  triggered: boolean
  /** Reports the new favorites count up to App. */
  setNewFav: (count: number) => void
}

/** The feed: fetches week after week of pictures as `triggered` fires. */
function Main(props: MainProps) {
  // useRef holds a value that survives re-renders without causing one.
  // Here it's a "has the first fetch started?" flag.
  const initializing = useRef(true)
  const [allImages, setAllImages] = useState<ApodItem[]>([])
  const [from, to] = dateRange(allImages.length)
  const criteria: DateRange = { start: from, end: to }
  const [imageUpdate, loading, callNASA] = useNasaImages(criteria)

  // Runs whenever `loading` flips: starts the first fetch, then appends each
  // response to the list once loading finishes. Driving data flow from a
  // loading flag like this is fragile (see #9, #10); chapter 04 replaces it
  // with a query library built for exactly this job.
  useLayoutEffect(() => {
    if (initializing.current && !allImages.length) {
      initializing.current = false
      callNASA()
    }
    if (!initializing.current && !allImages.length && !loading) {
      setAllImages(imageUpdate)
    } else if (!initializing.current && allImages.length && !loading) {
      setAllImages(allImages.concat(imageUpdate))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading])

  // Fetch the next week when App reports the user is near the bottom.
  useLayoutEffect(() => {
    if (props.triggered && allImages.length) {
      callNASA()
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
