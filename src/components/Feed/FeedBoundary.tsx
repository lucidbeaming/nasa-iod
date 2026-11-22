/**
 * src/components/Feed/FeedBoundary.tsx
 *
 * WHAT: Wraps the feed in the two boundaries every data-loading section
 *       needs: one for "still loading" and one for "failed".
 * WHERE: Rendered by App.tsx around <Feed>.
 * CONCEPTS: Suspense, error boundaries, QueryErrorResetBoundary
 * READ MORE:
 *   - https://react.dev/reference/react/Suspense
 *   - https://tanstack.com/query/latest/docs/framework/react/guides/suspense#resetting-error-boundaries
 *
 * 📘 Concept: Suspense and error boundaries, together
 * A component that loads data can be in three states: loading, failed, or
 * ready. The 2021 app tracked them with flags inside the component, and a
 * missing `setLoading(false)` left it "loading" forever after any error
 * (#9). The React way is to write the component for the *ready* state only,
 * and let boundaries above it handle the other two:
 *
 *   - While a child is loading, it *suspends*, and the nearest <Suspense>
 *     shows its `fallback` instead.
 *   - If a child throws while rendering (useSuspenseInfiniteQuery throws the
 *     query's error when the first page fails), the nearest error boundary
 *     catches it and shows its fallback instead.
 *
 * Like try/catch, a boundary handles everything below it, so where you place
 * it decides how much of the page a failure replaces. Here it's just the
 * feed: the header keeps working when NASA's service doesn't.
 *
 * Error boundaries are still class components under the hood (there's no
 * hook for "catch errors in my children"), which is why the small
 * react-error-boundary package is used instead of writing one.
 */
import { QueryErrorResetBoundary } from '@tanstack/react-query'
import { Suspense, type ReactNode } from 'react'
import { ErrorBoundary } from 'react-error-boundary'
import { ErrorFallback } from '../ErrorFallback.tsx'
import { FeedSkeleton } from './FeedSkeleton.tsx'

/** Loading and error boundaries for the feed. */
export function FeedBoundary({ children }: { children: ReactNode }) {
  return (
    // TanStack Query remembers that a query failed. Retrying only the
    // *boundary* would render the feed again and immediately re-throw the
    // remembered error. QueryErrorResetBoundary provides a `reset` that
    // clears it, so the query runs again; passing it to the boundary's
    // onReset ties "Try again" to both.
    <QueryErrorResetBoundary>
      {({ reset }) => (
        <ErrorBoundary FallbackComponent={ErrorFallback} onReset={reset}>
          <Suspense fallback={<FeedSkeleton />}>{children}</Suspense>
        </ErrorBoundary>
      )}
    </QueryErrorResetBoundary>
  )
}
