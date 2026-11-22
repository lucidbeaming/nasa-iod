/**
 * src/lib/favorites.ts
 *
 * WHAT: The favorites store: the reader's saved entries, kept in
 *       localStorage, with a tiny subscribe/notify API that React can read
 *       through useSyncExternalStore.
 * WHERE: Read through hooks/useFavorites.ts by the header (the count), each
 *        entry (the favorite button) and, from chapter 09, the favorites page.
 * CONCEPTS: external stores, immutable snapshots, validating stored data,
 *           data migrations, the `storage` event
 * READ MORE:
 *   - https://react.dev/reference/react/useSyncExternalStore
 *   - https://developer.mozilla.org/docs/Web/API/Window/storage_event
 *
 * 📘 Concept: an external store
 * React state lives inside components. localStorage lives outside React:
 * other tabs can change it, and no render knows when it changes. A *store*
 * wraps it with three things React understands:
 *
 *   - getSnapshot(): the current value, as an object that stays the same
 *     (===) until the data changes,
 *   - subscribe(listener): call `listener` whenever it does change,
 *   - functions that change the data and then notify.
 *
 * useSyncExternalStore (in hooks/useFavorites.ts) connects the two. Every
 * component that reads the store re-renders when, and only when, it changes.
 *
 * ⚠️ Common mistake (from v0-2021):
 * Image.js wrote the list to localStorage and then told App through a prop
 * callback (`setNewFav`), which passed a number down to Header, whose effect
 * re-read localStorage into its own state. Three components, two copies of
 * the data, and no way to hear about changes from another tab. The store
 * replaces all of it.
 */
import { z } from 'zod'
import type { ApodEntry } from '../api/apod.ts'
import type { RichNode } from '../api/richText.ts'

/** localStorage key. The version suffix lets a future format migrate cleanly. */
const KEY = 'nasa-iod:favorites:v1'
/** The 2021 app's key: a JSON array of `YYYY-MM-DD` strings. */
const LEGACY_KEY = 'nasaPics'

/**
 * One saved favorite. `entry` is null for favorites migrated from the 2021
 * format, which only stored the date; the favorites page fetches those and
 * fills them in with {@link resolveFavorite}.
 */
export interface Favorite {
  date: string
  entry: ApodEntry | null
}

// ─── Validation ──────────────────────────────────────────────────────────────
// localStorage is a boundary just like the network: an old version of the
// app, a browser extension or a curious reader in the dev tools can put
// anything there. So stored data is parsed with Zod, the same way API data
// is (see 📘 parse, don't just type in api/apod.ts). These schemas describe
// the app's own types, which is what gets stored.

// RichText is recursive (a link contains nodes), so its schema refers to
// itself through z.lazy, with an explicit type for TypeScript.
const RichNodeSchema: z.ZodType<RichNode> = z.lazy(() =>
  z.union([
    z.object({ type: z.literal('text'), text: z.string() }),
    z.object({ type: z.literal('break') }),
    z.object({ type: z.literal('strong'), children: z.array(RichNodeSchema) }),
    z.object({ type: z.literal('em'), children: z.array(RichNodeSchema) }),
    z.object({ type: z.literal('link'), href: z.url(), children: z.array(RichNodeSchema) }),
  ]),
)

const Base = {
  date: z.iso.date(),
  title: z.string(),
  explanation: z.array(RichNodeSchema),
  credit: z.array(RichNodeSchema),
  permalink: z.url(),
}

const EntrySchema: z.ZodType<ApodEntry> = z.discriminatedUnion('kind', [
  z.object({
    ...Base,
    kind: z.literal('image'),
    alt: z.string(),
    hdurl: z.url(),
    imageBase: z.url(),
    width: z.number().nullable(),
    height: z.number().nullable(),
  }),
  z.object({ ...Base, kind: z.literal('video'), embedUrl: z.url() }),
  z.object({ ...Base, kind: z.literal('other') }),
])

const Stored = z.array(z.object({ date: z.iso.date(), entry: EntrySchema.nullable() }))

// ─── Reading and writing ─────────────────────────────────────────────────────

/**
 * Reads localStorage safely. It can throw (storage disabled, some private
 * browsing modes), and the app should keep working without favorites.
 */
function readRaw(key: string): string | null {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

/** Parses the stored list, migrating the 2021 format the first time. */
function load(raw: string | null): Favorite[] {
  if (raw !== null) {
    const parsed = Stored.safeParse(safeJson(raw))
    if (parsed.success) return parsed.data
    console.warn('Ignoring unreadable favorites in localStorage:', z.prettifyError(parsed.error))
    return []
  }
  // 📘 Concept: data migrations
  // Readers of the 2021 version have favorites saved under `nasaPics`, as
  // bare dates. Rather than lose them, they're converted once into the new
  // format, with `entry: null` until the favorites page fetches each day.
  // The old key is left alone, so going back to an old build still works.
  const legacy = z.array(z.iso.date()).safeParse(safeJson(readRaw(LEGACY_KEY)))
  if (!legacy.success) return []
  const migrated = [...new Set(legacy.data)].map((date) => ({ date, entry: null }))
  save(migrated)
  return migrated
}

function safeJson(raw: string | null): unknown {
  if (raw === null) return null
  try {
    return JSON.parse(raw)
  } catch {
    return null
  }
}

function save(favorites: Favorite[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(favorites))
  } catch {
    // Storage full or disabled: favorites last until the tab closes.
  }
}

// ─── The store ───────────────────────────────────────────────────────────────

// The snapshot is cached alongside the raw string it was parsed from.
//
// ⚠️ useSyncExternalStore calls getSnapshot on every render and compares
// the result with ===. If getSnapshot parsed localStorage each time, it
// would return a *new* array every call, React would conclude the store
// changed on every render, and the component would re-render forever (React
// warns "The result of getSnapshot should be cached"). Re-parsing only when
// the raw string changes returns the same array until the data really does.
let cachedRaw: string | null | undefined
let cachedSnapshot: Favorite[] = []

/** The current favorites, newest saved first. Same array until something changes. */
export function getSnapshot(): Favorite[] {
  const raw = readRaw(KEY)
  if (raw !== cachedRaw || cachedRaw === undefined) {
    cachedSnapshot = load(raw)
    // load() may have just written the migrated list; cache what's stored now.
    cachedRaw = readRaw(KEY)
  }
  return cachedSnapshot
}

const listeners = new Set<() => void>()

/**
 * Subscribes to changes, from this tab or another.
 *
 * @returns an unsubscribe function, which useSyncExternalStore calls when
 *          the last component using the store unmounts.
 */
export function subscribe(listener: () => void): () => void {
  listeners.add(listener)
  // The `storage` event fires in *other* tabs when one tab changes
  // localStorage. Listening for it keeps every open tab in sync: favorite a
  // picture in one tab and the count updates in the others.
  const onStorage = (event: StorageEvent) => {
    if (event.key === KEY || event.key === null) listener()
  }
  window.addEventListener('storage', onStorage)
  return () => {
    listeners.delete(listener)
    window.removeEventListener('storage', onStorage)
  }
}

/** Writes a new list and notifies subscribers in this tab. */
function update(next: Favorite[]) {
  save(next)
  // The storage event doesn't fire in the tab that made the change, so
  // this tab's subscribers are told directly.
  for (const listener of listeners) listener()
}

/** True if the entry for `date` is saved. */
export function isFavorite(favorites: Favorite[], date: string): boolean {
  return favorites.some((f) => f.date === date)
}

/**
 * Saves an entry, or removes it if it's already saved.
 *
 * Note the new array: the snapshot is never mutated in place. Components
 * compare snapshots with ===, so a mutated array would look unchanged.
 *
 * @returns true if the entry is now saved, false if it was removed.
 */
export function toggleFavorite(entry: ApodEntry): boolean {
  const current = getSnapshot()
  if (isFavorite(current, entry.date)) {
    update(current.filter((f) => f.date !== entry.date))
    return false
  }
  update([{ date: entry.date, entry }, ...current])
  return true
}

/** Fills in the entry for a favorite migrated from the 2021 format. */
export function resolveFavorite(entry: ApodEntry) {
  const current = getSnapshot()
  if (!current.some((f) => f.date === entry.date && f.entry === null)) return
  update(current.map((f) => (f.date === entry.date ? { date: f.date, entry } : f)))
}
