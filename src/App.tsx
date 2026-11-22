/**
 * src/App.tsx
 *
 * WHAT: The root component. Holds the page layout and decides when the feed
 *       should load more pictures, by watching the scroll position.
 * WHERE: Rendered by main.tsx. Renders <Header> and <Feed>.
 * CONCEPTS: useState, useLayoutEffect, event listeners in effects, lifting
 *           state up, a Suspense boundary
 * READ MORE:
 *   - https://react.dev/reference/react/useLayoutEffect
 *   - https://react.dev/learn/sharing-state-between-components
 *
 * The scroll detection is still the 2021 logic, with a known bug (#10) that
 * chapter 05 fixes by replacing it. Fetching moved into <Feed> in chapter 04.
 */
import { Suspense, useLayoutEffect, useState } from 'react'
import './App.css'
import Header from './Header.tsx'
import Feed from './components/Feed/Feed.tsx'

/** Root component: layout plus scroll detection for the infinite feed. */
function App() {
  // `triggered` is true while the bottom of the page is near the viewport,
  // which tells <Feed> to fetch the next page of pictures.
  const [triggered, setTriggered] = useState(false)
  const [winHeight, setWinHeight] = useState(window.innerHeight)

  // `newFav` is the number of saved favorites. It lives here, in the closest
  // common parent of <Header> (which displays the count) and <Feed> (whose
  // images change it). This is "lifting state up".
  const [newFav, setNewFav] = useState(0)

  // useLayoutEffect runs after React updates the DOM but before the browser
  // paints. The original author used it so the first scroll measurement
  // happens before anything is shown; a plain useEffect would also work here.
  useLayoutEffect(() => {
    const checkHeight = () => {
      setWinHeight(window.innerHeight)
    }
    const isScrolling = () => {
      const root = document.getElementById('iod')
      if (!root) return
      // Known bug (#10): `winHeight` here is the value from the first render.
      // The effect below runs once (empty dependency array), so this function
      // closes over that first value forever, even after the window resizes
      // and setWinHeight stores a new one. Chapter 05 explains this "stale
      // closure" and replaces the listener with an IntersectionObserver.
      const bottomPosition = root.getBoundingClientRect().bottom - winHeight
      if (bottomPosition < winHeight * 2) {
        setTriggered(true)
      } else {
        setTriggered(false)
      }
    }
    window.addEventListener('scroll', isScrolling)
    window.addEventListener('resize', checkHeight)

    // The cleanup function runs when the component unmounts (and, in
    // StrictMode development, once right after mounting). Without it, every
    // remount would add another pair of listeners.
    return () => {
      window.removeEventListener('scroll', isScrolling)
      window.removeEventListener('resize', checkHeight)
      setTriggered(false)
    }
    // An empty dependency array means "run once after the first render".
    // oxlint's exhaustive-deps rule would flag `winHeight` as missing; it's
    // left as in 2021 so the bug stays visible until chapter 05. Suppressing
    // a hooks rule also makes the React Compiler skip this whole component
    // (see vite.config.ts): it can't prove the code is safe to memoize.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div id="iod">
      <Header newFav={newFav} />
      {/* <Feed> suspends until its first page arrives (see 📘 Suspense in
          Feed.tsx); until then React shows this fallback, the same loader
          the 2021 app used. Chapter 06 adds a skeleton and error handling. */}
      <Suspense fallback={<div className="iod-loader active"></div>}>
        <Feed triggered={triggered} setNewFav={setNewFav} />
      </Suspense>
    </div>
  )
}

export default App
