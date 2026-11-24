/**
 * src/main.tsx
 *
 * WHAT: The entry point. Finds the empty <div id="root"> in index.html and
 *       hands it to React.
 * WHERE: Loaded by the <script type="module"> tag in index.html. Everything
 *        else is imported from here.
 * CONCEPTS: createRoot, StrictMode, providers, routes
 * READ MORE:
 *   - https://react.dev/reference/react-dom/client/createRoot
 *   - https://react.dev/reference/react/StrictMode
 *   - https://tanstack.com/query/latest/docs/framework/react/reference/QueryClientProvider
 *   - https://reactrouter.com/start/declarative/routing
 *
 * (Named index.tsx until chapter 04. Vite's convention is main.tsx, which
 * couldn't be used while a Main.tsx component existed: macOS and Windows
 * file systems treat the two names as the same file.)
 */
import { QueryClientProvider } from '@tanstack/react-query'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Route, Routes } from 'react-router'
import './styles/global.css'
import { createQueryClient } from './api/queries.ts'
import App from './App.tsx'
import { DayPage } from './pages/DayPage.tsx'
import { FavoritesPage } from './pages/FavoritesPage.tsx'
import { FeedPage } from './pages/FeedPage.tsx'
import { NotFoundPage } from './pages/NotFoundPage.tsx'

// ⚠️ Common mistake (from v0-2021, src/index.js):
//   ReactDOM.render(<App />, document.getElementById('root'))
// ReactDOM.render was the React 17 API. It was deprecated in React 18 and
// removed in React 19, so the old entry point fails at startup. createRoot
// is its replacement, and it's what turns on React 18+ features such as
// automatic batching and concurrent rendering.
const container = document.getElementById('root')

// getElementById returns `HTMLElement | null`, and strict TypeScript won't let
// us pass a possible null to createRoot. Failing loudly here is better than a
// confusing error from inside React.
if (!container) {
  throw new Error('index.html is missing <div id="root">')
}

// One QueryClient for the whole app, created once, outside any component.
// It holds the cache. Creating it inside a component would make a new,
// empty cache on every render.
const queryClient = createQueryClient()

createRoot(container).render(
  // 📘 Concept: StrictMode
  // In development only, StrictMode renders every component twice and runs
  // every effect's setup → cleanup → setup once more. That surfaces code that
  // isn't safe to re-run (a missing cleanup, a mutation during render) while
  // you're writing it, instead of in production. It has no effect in builds.
  <StrictMode>
    {/* 📘 Concept: providers
        A provider puts a value in React context, so any component below it
        can read it without passing props through every level. Here every
        query hook in the app finds the same QueryClient (and cache). */}
    <QueryClientProvider client={queryClient}>
      {/* 📘 Concept: client-side routing
          The app is one HTML page. BrowserRouter watches the URL (through
          the History API) and <Routes> renders whichever <Route> matches,
          without asking the server for a new page. Links inside the app
          (<Link>) change the URL and re-render instantly.

          `basename` is the folder the app is served from: "/" in
          development, "/nasa-iod/" on GitHub Pages (chapter 14). Vite
          exposes it as import.meta.env.BASE_URL, which always ends in "/".
          The router is given it without that slash: a basename of
          "/react/nasa-iod/" doesn't match the bare folder URL
          "/react/nasa-iod", so the page would stay blank there, while
          "/react/nasa-iod" matches both. (GitHub Pages redirects the bare
          URL to the slashed one, which hid this.)

          Deep links on static hosting: opening /nasa-iod/day/2026-11-22
          directly asks the server for that file, which doesn't exist. Two
          common fixes:
            - Hash routing (/#/day/2026-11-22): the server only ever sees
              "/", so it always works, but URLs are uglier and search
              engines ignore everything after the #.
            - A 404.html that is a copy of index.html: GitHub Pages serves
              it for unknown paths, the app boots, and the router reads the
              real URL. Clean URLs; the cost is a 404 status on deep links.
          This app uses the second (set up in chapter 14). */}
      <BrowserRouter basename={import.meta.env.BASE_URL.replace(/\/$/, '') || '/'}>
        <Routes>
          {/* A route with an element but no path is a *layout*: App renders
              the header and an <Outlet/>, and the matching child route
              renders inside it. */}
          <Route element={<App />}>
            <Route index element={<FeedPage />} />
            <Route path="favorites" element={<FavoritesPage />} />
            {/* `:date` is a URL parameter, read with useParams(). */}
            <Route path="day/:date" element={<DayPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>,
)
