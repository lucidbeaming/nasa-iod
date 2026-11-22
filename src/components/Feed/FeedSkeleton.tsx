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
        <div className="image-block skeleton" key={i} aria-hidden="true">
          <div className="image-block-left"></div>
          <div className="image-block-inner">
            <div className="skeleton-image"></div>
            <div className="skeleton-title"></div>
          </div>
          <div className="image-block-right"></div>
        </div>
      ))}
    </div>
  )
}
