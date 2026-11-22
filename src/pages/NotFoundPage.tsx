/**
 * src/pages/NotFoundPage.tsx
 *
 * WHAT: The page for URLs the app doesn't know, and for malformed day links.
 * WHERE: The catch-all `*` route in main.tsx, and DayPage.tsx.
 * CONCEPTS: catch-all routes, client-side links
 */
import { Link } from 'react-router'

/** "Page not found", with a way back. */
export function NotFoundPage({ message = 'There’s no page at this address.' }) {
  return (
    <div id="main" className="iod-error">
      <title>Not found · NASA Image of the Day</title>
      {/* A static host can't send a 404 status for a single-page app's
          routes, so this tells search engines not to index the page. */}
      <meta name="robots" content="noindex" />
      <h2>Not found</h2>
      <p>{message}</p>
      <p>
        <Link to="/">Back to the feed</Link>
      </p>
    </div>
  )
}
