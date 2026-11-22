/**
 * src/components/Entry/Entry.tsx
 *
 * WHAT: One day in the feed, whatever its media: the media itself, the
 *       title bar with favorite and info buttons, the credit, the
 *       collapsible explanation, and the date stamp.
 * WHERE: Rendered by components/Feed/Feed.tsx, once per entry.
 * CONCEPTS: rendering a discriminated union, exhaustiveness checking,
 *           composition, toggle and disclosure buttons, useId
 * READ MORE:
 *   - https://www.typescriptlang.org/docs/handbook/2/narrowing.html#exhaustiveness-checking
 *   - https://www.w3.org/WAI/ARIA/apg/patterns/button/
 *   - https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/
 *
 * Replaces ImageBlock.tsx and Image.tsx (chapters 01–06). The frame is the
 * same for every kind of entry; only the media part differs, so the frame
 * lives here and the media parts are separate components.
 *
 * Chapter 10 made its controls accessible: see the ⚠️ on the toolbox below.
 */
import { useId, useState } from 'react'
import { Link } from 'react-router'
import type { ApodEntry } from '../../api/apod.ts'
import { useFavorites } from '../../hooks/useFavorites.ts'
import { isFavorite, toggleFavorite } from '../../lib/favorites.ts'
import { DateStamp } from './DateStamp.tsx'
import { ImageEntry } from './ImageEntry.tsx'
import styles from './Entry.module.css'
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
  // Whether the explanation is open. A boolean, not the 2021 class-name
  // string (" collapsed"): one fact drives both the `hidden` attribute and
  // aria-expanded, so the two can't disagree.
  const [expanded, setExpanded] = useState(false)

  // useId generates an id that's unique in the page (and stable between
  // renders), for attributes that point at other elements: aria-controls,
  // aria-labelledby. Hand-written ids would collide, since the feed renders
  // this component many times.
  const id = useId()
  const titleId = `${id}-title`
  const explanationId = `${id}-explanation`

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
    // can jump from one article to the next. aria-labelledby names it after
    // its title, so that jump announces which picture it is.
    <article className={styles.entry} data-kind={entry.kind} aria-labelledby={titleId}>
      <div className={styles.left}></div>
      <div className={styles.card}>
        <Media entry={entry} priority={priority} />
        <div className={styles.titleBar}>
          {/* The title links to the day's permalink (/day/:date). */}
          <h3 id={titleId} className={styles.title}>
            <Link to={`/day/${entry.date}`}>{entry.title}</Link>
          </h3>
          {/* ⚠️ Common mistake (from v0-2021, src/Image.js):
                <button className="fav-toggle">*</button>
                <button className={styles.toolButton}>?</button>
              A screen reader announces these as "star, button" and
              "question mark, button": no hint of what they do or whether
              they're on (#12). An icon button needs a text name, and a button
              that switches something on and off needs to expose its state. */}
          <div className={styles.toolbox}>
            {/* role="status" makes this a polite live region: the
                confirmation is announced without moving focus. */}
            <span className={styles.message} role="status">
              {savedFav}
            </span>
            {/* A *toggle button*: the name stays "Favorite", and
                aria-pressed says whether it's on. Changing the label instead
                ("Save" / "Unsave") would make the state hard to tell apart
                from the action. The star is decoration; the name comes from
                the visually hidden text. */}
            <button
              type="button"
              className={styles.toolButton}
              aria-pressed={saved}
              onClick={onFavorite}
            >
              <span aria-hidden="true">{saved ? '★' : '☆'}</span>
              <span className="visually-hidden">Favorite</span>
            </button>
            {/* A *disclosure button*: aria-expanded says whether the content
                it controls is shown, and aria-controls points at it. */}
            <button
              type="button"
              className={styles.toolButton}
              aria-expanded={expanded}
              aria-controls={explanationId}
              onClick={() => setExpanded(!expanded)}
            >
              <span aria-hidden="true">?</span>
              <span className="visually-hidden">Explanation</span>
            </button>
          </div>
          {entry.credit.length > 0 && (
            <p className={styles.credit}>
              <RichText nodes={entry.credit} />
            </p>
          )}
          {/* `hidden` removes the explanation from the page *and* from the
              accessibility tree. The 2021 version collapsed it with CSS
              (height: 0), which hid it from sight but not from screen
              readers: they read every explanation, open or not. */}
          <div className={styles.explanation} id={explanationId} hidden={!expanded}>
            <p>
              <RichText nodes={entry.explanation} />
            </p>
          </div>
        </div>
      </div>
      <div className={styles.right}>
        <DateStamp date={entry.date} />
      </div>
    </article>
  )
}
