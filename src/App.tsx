/**
 * src/App.tsx
 *
 * WHAT: The layout shared by every page: the header, and the current page
 *       below it.
 * WHERE: The layout route in main.tsx. Each page renders in its <Outlet>.
 * CONCEPTS: layout routes, <Outlet>
 * READ MORE: https://reactrouter.com/start/declarative/routing#layouts
 *
 * Until chapter 05 this file also watched the scroll position (that moved
 * to hooks/useInView.ts); until chapter 08 it held the favorites count
 * (that moved to a store, lib/favorites.ts); and until chapter 09 it
 * rendered the feed directly (that's pages/FeedPage.tsx now).
 */
import { Outlet } from 'react-router'
import './App.css'
import Header from './Header.tsx'

/** Layout: header plus the matched page. */
function App() {
  return (
    <div id="iod">
      <Header />
      {/* <Outlet> is where the matched child route renders: the feed at
          "/", the favorites page at "/favorites", and so on. */}
      <Outlet />
    </div>
  )
}

export default App
