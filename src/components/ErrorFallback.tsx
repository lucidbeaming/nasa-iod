/**
 * src/components/ErrorFallback.tsx
 *
 * WHAT: What the reader sees when a section of the page fails to load: a
 *       plain-language message and a Retry button.
 * WHERE: Rendered by the <ErrorBoundary> in components/Feed/FeedBoundary.tsx,
 *        which wraps the feed, the day page and each pending favorite.
 * CONCEPTS: error boundaries, narrowing `unknown`, recoverable errors
 * READ MORE:
 *   - https://react.dev/reference/react/Component#catching-rendering-errors-with-an-error-boundary
 *   - https://github.com/bvaughn/react-error-boundary
 */
import type { FallbackProps } from 'react-error-boundary'
import { ApiError } from '../api/apod.ts'
import styles from './ErrorFallback.module.css'

/**
 * Turns whatever was thrown into a sentence a reader can act on.
 *
 * Anything can be thrown in JavaScript (a string, a number, an object), so
 * the error arrives typed as `unknown`. TypeScript makes us check what it
 * is before reading fields, and `instanceof` checks double as type narrowing.
 */
function describe(error: unknown): { title: string; detail: string } {
  if (error instanceof ApiError) {
    if (error.status === 0) {
      return { title: 'You seem to be offline.', detail: error.message }
    }
    if (error.code === 'apod_basic_not_found') {
      return { title: 'There’s no picture for that day.', detail: error.message }
    }
    if (error.status >= 500) {
      return {
        title: 'NASA’s APOD service is having trouble.',
        detail: `${error.message} This is usually temporary.`,
      }
    }
    return { title: 'NASA’s APOD service refused the request.', detail: error.message }
  }
  // Not an ApiError: a bug in this app. Say so plainly; the details are in
  // the browser console (React logs every error a boundary catches).
  return {
    title: 'Something went wrong in this page.',
    detail: error instanceof Error ? error.message : String(error),
  }
}

/**
 * Error boundary fallback with a Retry button.
 *
 * `resetErrorBoundary` clears the boundary's error state and renders its
 * children again. Paired with TanStack Query's reset (see FeedBoundary.tsx),
 * that re-runs the failed query.
 */
export function ErrorFallback({ error, resetErrorBoundary }: FallbackProps) {
  const { title, detail } = describe(error)
  // A 4xx answer (such as "no picture for that day") will be the same next
  // time, so offering to retry would only invite a pointless click. The
  // query's retry policy makes the same distinction (api/queries.ts).
  const retryable = !(error instanceof ApiError && error.isClientError)
  return (
    // role="alert" makes screen readers announce the message as soon as it
    // appears, since it replaces content the reader was waiting for.
    <div className={styles.error} role="alert">
      <h2>{title}</h2>
      <p>{detail}</p>
      {retryable && (
        <button type="button" onClick={() => resetErrorBoundary()}>
          Try again
        </button>
      )}
    </div>
  )
}
