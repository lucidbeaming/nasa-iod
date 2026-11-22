/**
 * src/components/Entry/Entry.tsx
 *
 * WHAT: One day in the feed, whatever its media: the media itself, the
 *       title bar with favorite and info buttons, the credit, the
 *       collapsible explanation, and the date stamp.
 * WHERE: Rendered by components/Feed/Feed.tsx, once per entry.
 * CONCEPTS: rendering a discriminated union, exhaustiveness checking,
 *           composition
 * READ MORE: https://www.typescriptlang.org/docs/handbook/2/narrowing.html#exhaustiveness-checking
 *
 * Replaces ImageBlock.tsx and Image.tsx (chapters 01–06). The frame is the
 * same for every kind of entry; only the media part differs, so the frame
 * lives here and the media parts are separate components.
 *
 * Still carried over from 2021: the "*" and "?" buttons without accessible
 * names (chapter 10).
 */
import { useState } from 'react'
import { Link } from 'react-router'
import type { ApodEntry } from '../../api/apod.ts'
import { useFavorites } from '../../hooks/useFavorites.ts'
import { isFavorite, toggleFavorite } from '../../lib/favorites.ts'
import { DateStamp } from './DateStamp.tsx'
import { ImageEntry } from './ImageEntry.tsx'
import { LinkEntry } from './LinkEntry.tsx'
import { RichText } from './RichText.tsx'
import { VideoEntry } from './VideoEntry.tsx'

/** Props for {@link Entry}. */
interface EntryProps {
  entry: ApodEntry
  /** True for the first entry, whose image should load immediately. */
  priority?: boolean
}

/**
 * Picks the media component for an entry's kind.
 *
 * 📘 Concept: exhaustiveness checking
 * Each `case` narrows `entry` to one member of the union (see 📘
 * discriminated unions in api/apod.ts). After the last case, TypeScript
 * knows every kind has been handled, so `entry` has the type `never`. If a
 * fourth kind is ever added to ApodEntry and not handled here, assigning it
 * to `never` stops compiling: the type checker finds every place that
 * needs updating.
 */
function Media({ entry, priority }: { entry: ApodEntry; priority: boolean }) {
  switch (entry.kind) {
    case 'image':
      return <ImageEntry entry={entry} priority={priority} />
    case 'video':
      return <VideoEntry entry={entry} />
    case 'other':
      return <LinkEntry entry={entry} />
    default: {
      const unhandled: never = entry
      return unhandled
    }
  }
}

/** One APOD entry: media, title bar, credit, explanation and date. */
export function Entry({ entry, priority = false }: EntryProps) {
  // Carried over from 2021 (class-name-as-state); chapter 10 turns this
  // into a boolean with aria-expanded.
  const [collapsed, setCollapsed] = useState(' collapsed')

  const toggleAbout = () => {
    setCollapsed(collapsed === ' collapsed' ? '' : ' collapsed')
  }

  // Saved or not is read from the store, never copied into local state, so
  // every entry, the header and other tabs always agree.
  const saved = isFavorite(useFavorites(), entry.date)

  // A short confirmation after the button is pressed. This *is* local UI
  // state: it describes what this button just did, not the saved data.
  const [savedFav, setSavedFav] = useState('')

  // The 2021 button could only add ("Already saved" on a second press). It
  // now toggles, since the store makes removing as easy as adding.
  const onFavorite = () => {
    const nowSaved = toggleFavorite(entry)
    setSavedFav(nowSaved ? 'Saved in favorites' : 'Removed from favorites')
  }

  return (
    // <article> marks a self-contained item in a feed; screen reader users
    // can jump from one article to the next.
    <article className={`image-block entry-${entry.kind}`}>
      <div className="image-block-left">&nbsp;</div>
      <div className="image-block-inner">
        <Media entry={entry} priority={priority} />
        <div className="title-bar">
          {/* The title links to the day's permalink (/day/:date). */}
          <h3>
            <Link to={`/day/${entry.date}`}>{entry.title}</Link>
          </h3>
          <div className="toolbox">
            <span className="fav-message">{savedFav}</span>
            <button className={`fav-toggle${saved ? ' saved' : ''}`} onClick={onFavorite}>
              *
            </button>
            <button className="info-toggle" onClick={toggleAbout}>
              ?
            </button>
          </div>
          {entry.credit.length > 0 && (
            <p className="credit">
              <RichText nodes={entry.credit} />
            </p>
          )}
          <div className={`caption-box${collapsed}`}>
            <p>
              <RichText nodes={entry.explanation} />
            </p>
          </div>
        </div>
      </div>
      <div className="image-block-right">
        <DateStamp date={entry.date} />
      </div>
    </article>
  )
}
