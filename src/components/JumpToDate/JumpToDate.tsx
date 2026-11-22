/**
 * src/components/JumpToDate/JumpToDate.tsx
 *
 * WHAT: A small form: pick a date, and if there's a picture for it, go to
 *       its page. Otherwise, say why not.
 * WHERE: Rendered in Header.tsx.
 * CONCEPTS: form Actions, useActionState, useFormStatus, validating input,
 *           accessible error messages
 * READ MORE:
 *   - https://react.dev/reference/react-dom/components/form
 *   - https://react.dev/reference/react/useActionState
 *   - https://react.dev/reference/react-dom/hooks/useFormStatus
 *
 * 📘 Concept: Actions
 * Before React 19, a form needed: a submit handler that calls
 * preventDefault, state for the input, state for "submitting", state for
 * the error, and care to reset them all in the right order. React 19 lets
 * you pass a function as a form's `action`. React calls it with the form's
 * FormData when the form is submitted, runs it in a transition (so the page
 * stays responsive), and tracks whether it's pending.
 *
 * useActionState wraps such a function and keeps what it last returned as
 * state: here, an error message, or nothing. The component renders from
 * that state; there's no separate "error" or "loading" state to keep in step.
 */
import { useQueryClient } from '@tanstack/react-query'
import { useActionState, useId } from 'react'
import { useFormStatus } from 'react-dom'
import { useNavigate } from 'react-router'
import { ApiError } from '../../api/apod.ts'
import { dayQuery } from '../../api/queries.ts'
import { ARCHIVE_START, isArchiveDate, todayInArchive } from '../../lib/dates.ts'
import styles from './JumpToDate.module.css'

/** What the action returns: the last date tried, and an error if it failed. */
interface JumpState {
  date: string
  error: string | null
}

/**
 * The submit button. A separate component because useFormStatus reads the
 * status of the <form> it's *inside*, so it must be called by a child of
 * that form, not by the component that renders the form.
 */
function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <button type="submit" disabled={pending}>
      {pending ? 'Checking…' : 'Go'}
    </button>
  )
}

/** Date picker that navigates to `/day/:date` when that day has an APOD. */
export function JumpToDate() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const id = useId()
  const errorId = `${id}-error`

  const [state, formAction] = useActionState(
    // The action: (previous state, form data) → next state. It can be async;
    // React marks the form pending until the promise settles.
    async (_previous: JumpState, formData: FormData): Promise<JumpState> => {
      const date = String(formData.get('date') ?? '')

      // Validate before asking the server: the date input's min and max
      // stop most mistakes in the picker, but a typed or pasted value can
      // still be anything.
      if (!isArchiveDate(date)) {
        return {
          date,
          error:
            date < ARCHIVE_START
              ? 'APOD started on June 16, 1995. Choose a later date.'
              : 'Choose a date between June 16, 1995 and today.',
        }
      }

      // Check that the day has a picture before navigating, so the reader
      // gets the answer here rather than on a "not found" page. fetchQuery
      // uses the same key as DayPage, so if the day exists, the page that
      // opens next renders from the cache without a second request.
      // `retry: false` overrides the default policy (3 retries with growing
      // delays, about 7 seconds when offline): someone waiting on a button
      // should hear back quickly, and can simply press Go again.
      try {
        await queryClient.fetchQuery({ ...dayQuery(date), retry: false })
      } catch (error) {
        return {
          date,
          error:
            error instanceof ApiError && error.code === 'apod_basic_not_found'
              ? 'There’s no picture for that day. (A few early days were skipped.)'
              : 'Couldn’t reach NASA’s APOD service. Try again in a moment.',
        }
      }

      await navigate(`/day/${date}`)
      return { date, error: null }
    },
    { date: '', error: null },
  )

  return (
    // `action={formAction}` instead of onSubmit: no preventDefault, no
    // reading values from state. After a successful action, React resets
    // the form's uncontrolled inputs, like a browser would after a submit.
    <form className={styles.form} action={formAction}>
      <label htmlFor={`${id}-date`}>Jump to a date</label>
      <input
        id={`${id}-date`}
        name="date"
        type="date"
        min={ARCHIVE_START}
        max={todayInArchive()}
        required
        // After a *failed* action the form is reset too, which would erase
        // what the reader typed. defaultValue puts the last tried date back.
        defaultValue={state.date}
        aria-invalid={state.error ? true : undefined}
        aria-describedby={state.error ? errorId : undefined}
      />
      <SubmitButton />
      {/* role="alert" announces a new error immediately; aria-describedby on
          the input also reads it when the reader returns to the field. */}
      {state.error && (
        <p id={errorId} className={styles.error} role="alert">
          {state.error}
        </p>
      )}
    </form>
  )
}
