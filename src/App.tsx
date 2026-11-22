/**
 * src/App.tsx
 *
 * WHAT: The root component: the page layout, and the favorites count shared
 *       by the header and the feed.
 * WHERE: Rendered by main.tsx. Renders <Header> and <Feed>.
 * CONCEPTS: lifting state up, a Suspense boundary
 * READ MORE:
 *   - https://react.dev/learn/sharing-state-between-components
 *   - https://react.dev/reference/react/Suspense
 *
 * Until chapter 05 this file also watched the scroll position, with a
 * window-height bug (#10). That job moved to an IntersectionObserver in
 * hooks/useInView.ts, used by the feed itself: the component that needs to
 * know "is the bottom near?" now asks the browser directly.
 */
import { Suspense, useState } from 'react'
import './App.css'
import Header from './Header.tsx'
import Feed from './components/Feed/Feed.tsx'

/** Root component: header, feed, and the state they share. */
function App() {
  // `newFav` is the number of saved favorites. It lives here, in the closest
  // common parent of <Header> (which displays the count) and <Feed> (whose
  // images change it). This is "lifting state up". Chapter 08 replaces it
  // with a store both components read directly.
  const [newFav, setNewFav] = useState(0)

  return (
    <div id="iod">
      <Header newFav={newFav} />
      {/* <Feed> suspends until its first page arrives (see 📘 Suspense in
          Feed.tsx); until then React shows this fallback, the same loader
          the 2021 app used. Chapter 06 adds a skeleton and error handling. */}
      <Suspense fallback={<div className="iod-loader active"></div>}>
        <Feed setNewFav={setNewFav} />
      </Suspense>
    </div>
  )
}

export default App
