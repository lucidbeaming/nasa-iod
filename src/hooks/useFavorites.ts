/**
 * src/hooks/useFavorites.ts
 *
 * WHAT: Gives a component the current favorites, and re-renders it whenever
 *       they change, in this tab or another.
 * WHERE: Used by Header.tsx (count), Entry.tsx (favorite button) and, from
 *        chapter 09, the favorites page.
 * CONCEPTS: useSyncExternalStore
 * READ MORE: https://react.dev/reference/react/useSyncExternalStore
 *
 * The store itself is in lib/favorites.ts; see 📘 an external store there.
 */
import { useSyncExternalStore } from 'react'
import { getSnapshot, subscribe, type Favorite } from '../lib/favorites.ts'

/**
 * Returns the saved favorites, newest first.
 *
 * Several components can call this at once. They all read the same snapshot,
 * so they can never disagree. (With useState + useEffect, each would keep
 * its own copy, and for one render after a change they'd show different
 * counts: what React calls "tearing".)
 */
export function useFavorites(): Favorite[] {
  // subscribe: how React listens for changes.
  // getSnapshot: how React reads the current value; must return the same
  //   object until the data changes (see the ⚠️ in lib/favorites.ts).
  return useSyncExternalStore(subscribe, getSnapshot)
}
