/**
 * src/App.tsx
 *
 * WHAT: The layout shared by every page: a skip link, the header, and the
 *       current page in <main>. Moves focus to the new page after navigation.
 * WHERE: The layout route in main.tsx. Each page renders in its <Outlet>.
 * CONCEPTS: layout routes, <Outlet>, landmarks, skip links, focus
 *           management in single-page apps, StrictMode-safe effects
 * READ MORE:
 *   - https://reactrouter.com/start/declarative/routing#layouts
 *   - https://www.w3.org/WAI/WCAG22/Techniques/general/G1
 *
 * Until chapter 05 this file also watched the scroll position (that moved
 * to hooks/useInView.ts); until chapter 08 it held the favorites count
 * (that moved to a store, lib/favorites.ts); and until chapter 09 it
 * rendered the feed directly (that's pages/FeedPage.tsx now).
 */
import { useEffect, useRef } from 'react'
import { Outlet, useLocation } from 'react-router'
import './App.css'
import Header from './Header.tsx'

/** Layout: skip link, header and the matched page. */
function App() {
  const { pathname } = useLocation()
  const mainRef = useRef<HTMLElement>(null)
  // The path we last moved focus for. A ref, because it's bookkeeping, not
  // something to display: changing it shouldn't re-render.
  const handledPath = useRef(pathname)

  // 📘 Concept: focus management after client-side navigation
  // When a normal website loads a new page, the browser starts focus and
  // scroll at the top, and screen readers announce the new page. A
  // single-page app only swaps part of the DOM, so none of that happens:
  // focus stays on the link that was clicked (which may no longer exist),
  // and a screen reader user hears nothing. After each navigation, this
  // effect does what the browser would have done: scroll to the top and
  // move focus to the start of the new page's content.
  //
  // ⚠️ Common mistake: skipping the first render with a "first run" flag:
  //   const first = useRef(true)
  //   useEffect(() => { if (first.current) { first.current = false; return } ... })
  // In development, StrictMode runs every effect twice on mount (see
  // main.tsx). The second run finds the flag already false and steals focus
  // on the initial load. Comparing against the last handled path is correct
  // however many times the effect runs.
  useEffect(() => {
    if (handledPath.current === pathname) return
    handledPath.current = pathname
    window.scrollTo(0, 0)
    // preventScroll: we just scrolled to the top ourselves.
    mainRef.current?.focus({ preventScroll: true })
  }, [pathname])

  return (
    <div id="iod">
      {/* A skip link lets keyboard users jump past the header to the
          content. It's the first focusable element, visible only when
          focused. */}
      <a className="skip-link" href="#content">
        Skip to content
      </a>
      <Header />
      {/* <main> is the page's main landmark. tabIndex={-1} lets the effect
          above focus it, without adding it to the Tab order. */}
      <main id="content" ref={mainRef} tabIndex={-1}>
        {/* <Outlet> is where the matched child route renders: the feed at
            "/", the favorites page at "/favorites", and so on. */}
        <Outlet />
      </main>
    </div>
  )
}

export default App
