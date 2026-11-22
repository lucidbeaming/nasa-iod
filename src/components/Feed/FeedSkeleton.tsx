/**
 * src/components/Feed/FeedSkeleton.tsx
 *
 * WHAT: A placeholder shaped like the feed, shown while the first page loads.
 * WHERE: The <Suspense fallback> in components/Feed/FeedBoundary.tsx.
 * CONCEPTS: skeleton screens, announcing loading to assistive technology
 * READ MORE: https://developer.mozilla.org/docs/Web/Accessibility/ARIA/Reference/Attributes/aria-busy
 *
 * A spinner says "wait"; a skeleton also says "here's what's coming", and
 * because it takes up roughly the space of the real content, the page
 * doesn't jump when the pictures arrive.
 */
import entry from '../Entry/Entry.module.css'
import styles from './FeedSkeleton.module.css'

/** Number of placeholder entries: enough to fill a tall screen. */
const PLACEHOLDERS = 3

/** Loading placeholder for the feed. */
export function FeedSkeleton() {
  return (
    // aria-busy tells assistive technology this region is still loading;
    // the visually hidden status gives screen readers the words for it.
    <div aria-busy="true">
      <p className="visually-hidden" role="status">
        Loading pictures…
      </p>
      {Array.from({ length: PLACEHOLDERS }, (_, i) => (
        // These placeholders never reorder or change, so an index is a fine
        // key here (compare the ⚠️ about keys in ImageBlock.tsx).
        <div className={entry.entry} key={i} aria-hidden="true">
          <div className={entry.left}></div>
          <div className={entry.card}>
            <div className={styles.image}></div>
            <div className={styles.title}></div>
          </div>
          <div className={entry.right}></div>
        </div>
      ))}
    </div>
  )
}
