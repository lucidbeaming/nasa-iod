/**
 * src/pages/FavoritesPage.tsx
 *
 * WHAT: The saved favorites (`/favorites`), newest saved first.
 * WHERE: Rendered by the `/favorites` route in main.tsx. Replaces the 2021
 *        "SHOW" button, which only logged the saved dates to the console.
 * CONCEPTS: rendering from a store, one boundary per item, an effect that
 *           writes to an external store
 */
import { useSuspenseQuery } from '@tanstack/react-query'
import { useEffect } from 'react'
import { Link } from 'react-router'
import { dayQuery } from '../api/queries.ts'
import { Entry } from '../components/Entry/Entry.tsx'
import { FeedBoundary } from '../components/Feed/FeedBoundary.tsx'
import { useFavorites } from '../hooks/useFavorites.ts'
import { resolveFavorite } from '../lib/favorites.ts'
import page from '../styles/page.module.css'

/**
 * A favorite saved by the 2021 version, which stored only its date: fetch
 * the entry, show it, and save it into the store so it isn't fetched again.
 */
function PendingFavorite({ date }: { date: string }) {
  const { data: entry } = useSuspenseQuery(dayQuery(date))
  // Writing the fetched entry into the store is *synchronizing with an
  // external system*, which is what effects are for. (Calling it during
  // render would update other components while React is rendering this one,
  // which React forbids.) Once stored, the list renders this favorite as a
  // plain <Entry>, and this component unmounts.
  useEffect(() => {
    resolveFavorite(entry)
  }, [entry])
  return <Entry entry={entry} />
}

/** The favorites page. */
export function FavoritesPage() {
  const favorites = useFavorites()
  return (
    <div className={page.page}>
      <title>{`Favorites (${favorites.length}) · NASA Image of the Day`}</title>
      <meta name="robots" content="noindex" />
      <h2 className={page.title}>Favorites</h2>
      {favorites.length === 0 ? (
        <p className={page.notice}>
          No favorites yet. Press <strong>*</strong> on any picture to save it here.{' '}
          <Link to="/">Back to the feed</Link>
        </p>
      ) : (
        <div>
          {favorites.map(({ date, entry }) =>
            entry ? (
              <Entry key={date} entry={entry} />
            ) : (
              // Each pending favorite gets its own boundary, so one day that
              // fails to load doesn't hide the others.
              <FeedBoundary key={date}>
                <PendingFavorite date={date} />
              </FeedBoundary>
            ),
          )}
        </div>
      )}
    </div>
  )
}
