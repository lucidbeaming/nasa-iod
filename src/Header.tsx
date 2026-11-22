/**
 * src/Header.tsx
 *
 * WHAT: The page header: title, favorites count, a "SHOW" button and a
 *       collapsible "about" panel.
 * WHERE: Rendered by App.tsx.
 * CONCEPTS: reading an external store, deriving values during render
 * READ MORE: https://react.dev/learn/you-might-not-need-an-effect
 *
 * Since chapter 08 the count comes straight from the favorites store. Since
 * chapter 09 the title links home and "SHOW" links to the favorites page
 * (in 2021 it only logged the saved dates to the console).
 */
import { useState } from 'react'
import { Link } from 'react-router'
import { useFavorites } from './hooks/useFavorites.ts'

/** Page header with the favorites count and the about panel. */
function Header() {
  // The class-name-as-state pattern: " collapsed" or "". Chapter 10 replaces
  // it with a boolean plus aria-expanded, which is what assistive technology
  // needs to announce the panel's state.
  const [collapsed, setCollapsed] = useState(' collapsed')

  const toggleAbout = () => {
    if (collapsed !== ' collapsed') {
      setCollapsed(' collapsed')
    } else {
      setCollapsed('')
    }
  }

  const favorites = useFavorites()

  // ⚠️ Common mistake (from v0-2021, src/Header.js):
  //   const [favoriteCount, setFavoriteCount] = useState(...)
  //   useLayoutEffect(() => { checkFav() }, [props])   // checkFav calls setFavoriteCount
  // The count was *derived* data (it follows from the saved list), copied
  // into state by an effect after every render. That costs an extra render
  // each time, can show a stale count for a frame, and needed a prop from App
  // just to know when to re-check. Derived values are computed during render:
  // when the store changes, the header re-renders and this line runs again.
  const favoriteCount =
    favorites.length === 0
      ? 'No favorites saved yet'
      : `${favorites.length} favorite${favorites.length > 1 ? 's' : ''} saved`

  return (
    <header className="iod-header">
      <h1>
        <Link to="/">NASA Image of the Day</Link>
      </h1>
      <p>
        {favoriteCount}{' '}
        {/* <Link> renders a real <a href>, so it works with the keyboard,
            middle-click and "open in new tab", but navigates without a page
            load. (A button that calls navigate() would lose all of that.) */}
        <Link className={favorites.length ? '' : 'hidden'} to="/favorites">
          SHOW
        </Link>
      </p>
      <button className="iod-link" onClick={toggleAbout}>
        ?
      </button>
      <div className={`app-info${collapsed}`}>
        <p>
          This is a demonstration of inifinite scrolling in a React app. The official NASA image of
          the day site is{' '}
          <a href="https://www.nasa.gov/multimedia/imagegallery/iotd.html">
            https://www.nasa.gov/multimedia/imagegallery/iotd.html
          </a>
          .
        </p>
      </div>
    </header>
  )
}

export default Header
