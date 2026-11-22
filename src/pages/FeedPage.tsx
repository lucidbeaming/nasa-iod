/**
 * src/pages/FeedPage.tsx
 *
 * WHAT: The home page (`/`): the infinite feed.
 * WHERE: Rendered by the `/` route in main.tsx, inside App's layout.
 * CONCEPTS: React 19 document metadata
 * READ MORE: https://react.dev/reference/react-dom/components/title
 */
import Feed from '../components/Feed/Feed.tsx'
import { FeedBoundary } from '../components/Feed/FeedBoundary.tsx'

/** The feed, with its title and description. */
export function FeedPage() {
  return (
    <>
      {/* 📘 Concept: document metadata in React 19
          <title> and <meta> can be rendered from any component. React moves
          them into the document's <head>, and replaces them when another
          page renders its own. Before React 19 this needed a library (React
          Helmet) or an effect that set document.title by hand. */}
      <title>NASA Image of the Day</title>
      <meta
        name="description"
        content="An infinite-scrolling feed of NASA's Astronomy Picture of the Day."
      />
      <FeedBoundary>
        <Feed />
      </FeedBoundary>
    </>
  )
}
