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
 * Still carried over from 2021: favorites as a date list in localStorage
 * (chapter 08 replaces it with a shared store) and the "*" and "?" buttons
 * without accessible names (chapter 10).
 */
import { useState } from 'react'
import type { ApodEntry } from '../../api/apod.ts'
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
  /** Reports the new favorites count up to App. */
  setNewFav: (count: number) => void
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
export function Entry({ entry, priority = false, setNewFav }: EntryProps) {
  // Carried over from 2021 (class-name-as-state); chapter 10 turns this
  // into a boolean with aria-expanded.
  const [collapsed, setCollapsed] = useState(' collapsed')
  const [savedFav, setSavedFav] = useState('')

  const toggleAbout = () => {
    setCollapsed(collapsed === ' collapsed' ? '' : ' collapsed')
  }

  // Carried over from 2021; chapter 08 replaces it with a favorites store.
  const setFavorite = (date: string) => {
    let favArr = JSON.parse(localStorage.getItem('nasaPics') ?? 'null') as string[] | null
    if (favArr !== null) {
      if (favArr.indexOf(date) === -1) {
        favArr.push(date)
        setNewFav(favArr.length)
        setSavedFav('Saved in favorites')
      } else {
        setSavedFav('Already saved')
      }
    } else {
      favArr = [date]
      setNewFav(favArr.length)
      setSavedFav('Your first favorite!')
    }
    localStorage.setItem('nasaPics', JSON.stringify(favArr))
  }

  return (
    // <article> marks a self-contained item in a feed; screen reader users
    // can jump from one article to the next.
    <article className={`image-block entry-${entry.kind}`}>
      <div className="image-block-left">&nbsp;</div>
      <div className="image-block-inner">
        <Media entry={entry} priority={priority} />
        <div className="title-bar">
          <h3>{entry.title}</h3>
          <div className="toolbox">
            <span className="fav-message">{savedFav}</span>
            <button className="fav-toggle" onClick={() => setFavorite(entry.date)}>
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
