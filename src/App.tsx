/**
 * src/App.tsx
 *
 * WHAT: The root component: the page layout.
 * WHERE: Rendered by main.tsx. Renders <Header> and <Feed>.
 * CONCEPTS: where to put boundaries
 * READ MORE: https://react.dev/reference/react/Suspense
 *
 * Until chapter 05 this file also watched the scroll position (that moved
 * to hooks/useInView.ts), and until chapter 08 it held the favorites count,
 * "lifted up" so Header and the feed could share it. A shared store
 * (lib/favorites.ts) replaced that: each component reads what it needs.
 */
import './App.css'
import Header from './Header.tsx'
import Feed from './components/Feed/Feed.tsx'
import { FeedBoundary } from './components/Feed/FeedBoundary.tsx'

/** Root component: header and feed. */
function App() {
  return (
    <div id="iod">
      <Header />
      {/* Loading and error handling for the feed only (see 📘 in
          FeedBoundary.tsx): if NASA's service is down, the header still
          works. */}
      <FeedBoundary>
        <Feed />
      </FeedBoundary>
    </div>
  )
}

export default App
