/**
 * src/components/Entry/LinkEntry.tsx
 *
 * WHAT: The fallback for entries that are neither a picture nor a playable
 *       video (interactive pages, embeds this app doesn't recognize).
 * WHERE: Rendered by Entry.tsx when `entry.kind === 'other'`.
 * CONCEPTS: graceful degradation
 *
 * Every day of the archive gets a place in the feed, even when this app
 * can't show its content: a clear link to NASA's page beats a gap (#11).
 */
import type { OtherEntry } from '../../api/apod.ts'
import styles from './Media.module.css'

/** A link to the entry's page on NASA's site. */
export function LinkEntry({ entry }: { entry: OtherEntry }) {
  return (
    <p className={styles.notice}>
      This day’s APOD can’t be shown here.{' '}
      <a href={entry.permalink} target="_blank" rel="noreferrer">
        See “{entry.title}” on NASA’s site
      </a>
      .
    </p>
  )
}
