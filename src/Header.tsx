/**
 * src/Header.tsx
 *
 * WHAT: The page header: title, favorites count, a "SHOW" button and a
 *       collapsible "about" panel.
 * WHERE: Rendered by App.tsx, which passes the current favorites count.
 * CONCEPTS: props, useState for UI toggles, reading localStorage
 * READ MORE: https://react.dev/learn/passing-props-to-a-component
 *
 * Ported from 2021 without behavior changes. "SHOW" only logs to the console;
 * chapter 08 adds a real favorites store and chapter 09 a favorites page.
 */
import { useLayoutEffect, useState } from 'react'

/** Props for {@link Header}. */
interface HeaderProps {
  /** Number of saved favorites, owned by App. Changing it re-reads the count. */
  newFav: number
}

/** Page header with the favorites count and the about panel. */
function Header(props: HeaderProps) {
  // The class-name-as-state pattern: " collapsed" or "". Chapter 10 replaces
  // it with a boolean plus aria-expanded, which is what assistive technology
  // needs to announce the panel's state.
  const [collapsed, setCollapsed] = useState(' collapsed')
  const [favoriteCount, setFavoriteCount] = useState(' collapsed')

  const toggleAbout = () => {
    if (collapsed !== ' collapsed') {
      setCollapsed(' collapsed')
    } else {
      setCollapsed('')
    }
  }

  // localStorage only stores strings, so the favorites list is saved as JSON.
  // JSON.parse returns `any`; annotating it as string[] is a promise to
  // TypeScript, not a check (see 📘 in types.ts).
  const readFavorites = (): string[] | null =>
    JSON.parse(localStorage.getItem('nasaPics') ?? 'null') as string[] | null

  const checkFav = () => {
    const favArr = readFavorites()
    if (favArr !== null) {
      const count = favArr.length.toString()
      const plural = favArr.length > 1 ? 's' : ''
      setFavoriteCount(count + ' favorite' + plural + ' saved')
    } else {
      setFavoriteCount('No favorites saved yet')
    }
  }

  const showFavs = () => {
    readFavorites()?.forEach((item) => {
      console.log(item)
    })
  }

  // Re-count favorites whenever App passes a new `newFav`. Copying derived
  // data into state like this is what chapter 08's external store replaces:
  // the count can simply be computed from the store on every render.
  // The react-compiler/set-state-in-effect lint warning on checkFav() flags
  // exactly this, and the eslint-disable below makes the compiler skip Header.
  useLayoutEffect(() => {
    checkFav()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props])

  return (
    <header className="iod-header">
      <h1>NASA Image of the Day</h1>
      <p>
        {favoriteCount}{' '}
        <button className={favoriteCount.indexOf('No') ? '' : 'hidden'} onClick={showFavs}>
          SHOW
        </button>
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
