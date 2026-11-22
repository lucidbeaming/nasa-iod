# Tutorial

This is the reading guide. Each chapter is one pull request and one git tag, so you can read the diff, check out the tag, and run the app as it was at that point.

Start with [`CONVENTIONS.md`](CONVENTIONS.md) for how the comments are organized, and [`STACK.md`](STACK.md) for why each dependency is here.

## Where it starts

The starting point is tag [`v0-2021`](https://github.com/lucidbeaming/nasa-iod/tree/v0-2021): the original 2021 version, built with Create React App and React 17. Its bugs are filed as issues #8–#12 and fixed along the way. The ⚠️ comments in the code quote it.

## Chapters

| Ch. | Topic                                           | Issue | Tag          | Concepts                                                          |
| --- | ----------------------------------------------- | ----- | ------------ | ----------------------------------------------------------------- |
| 00  | Textbook standards                              | #13   | `chapter-00` | conventions, how to read this repo                                |
| 01  | Create React App → Vite + React 19 + TypeScript | #14   | `chapter-01` | `createRoot`, `import.meta.env`, typed props                      |
| 02  | React Compiler                                  | #15   | `chapter-02` | automatic memoization                                             |
| 03  | Typed APOD client                               | #16   | `chapter-03` | Zod, discriminated unions, parsing at the boundary, `AbortSignal` |
| 04  | TanStack Query infinite queries                 | #17   | `chapter-04` | server state vs client state, caching, pagination                 |
| 05  | Infinite scroll                                 | #18   | `chapter-05` | IntersectionObserver, callback refs with cleanup                  |
| 06  | Loading and error states                        | #19   | `chapter-06` | Suspense, error boundaries, `aria-live`                           |
| 07  | Every media type                                | #20   | `chapter-07` | rendering a discriminated union, derived state, responsive images |
| 08  | Favorites                                       | #21   | `chapter-08` | `useSyncExternalStore`, `localStorage`, data migration            |
| 09  | Routing                                         | #22   | `chapter-09` | React Router, document metadata, deep links on static hosting     |
| 10  | Accessibility                                   | #23   | `chapter-10` | ARIA state, focus management, reduced motion                      |
| 11  | Jump to a date                                  | #24   | `chapter-11` | form Actions, `useActionState`, `useFormStatus`                   |
| 12  | Styling                                         | #25   | `chapter-12` | CSS Modules, design tokens, dark mode                             |
| 13  | About text and credits                          | #26   | `chapter-13` | —                                                                 |
| 14  | GitHub Pages                                    | #27   | `chapter-14` | static deployment, base paths                                     |
| 15  | Docs and README                                 | #28   | `chapter-15` | —                                                                 |

Each chapter gets a section below once it's merged, listing the files to read in order and the concepts each one introduces.

## Chapter 01: Vite, React 19 and TypeScript

The migration is split into commits so each step is visible on its own:

1. **`chore: replace Create React App with Vite and React 19`**: the original JavaScript, renamed to `.jsx`, running on Vite. Only the changes Vite and React 19 require: `index.html` moves to the root, `ReactDOM.render` becomes `createRoot`, and `process.env.REACT_APP_*` becomes `import.meta.env.VITE_*`.
2. **`refactor: port the app to TypeScript`**: the same components as `.tsx` with typed props. Behavior is unchanged on purpose; the known bugs are marked with their issue numbers.
3. **`chore: add oxlint and Prettier`** and **`style: format with Prettier`**.

Read in this order:

| File                                  | Concepts                                                          |
| ------------------------------------- | ----------------------------------------------------------------- |
| `index.html`, `vite.config.ts`        | Vite's entry point and plugins                                    |
| `tsconfig.json`, `tsconfig.app.json`  | project references; why Vite doesn't type-check                   |
| `src/index.tsx`                       | 📘 StrictMode; ⚠️ `ReactDOM.render`                               |
| `src/types.ts`                        | 📘 types describe, they don't check                               |
| `src/App.tsx`                         | lifting state up; the stale-closure bug (#10)                     |
| `src/Main.tsx`                        | 📘 environment variables in Vite; the loading-flag data flow (#9) |
| `src/ImageBlock.tsx`, `src/Image.tsx` | keys; toggled vs one-way state (#12)                              |

## Chapter 02: React Compiler

| File                            | Concepts                                                           |
| ------------------------------- | ------------------------------------------------------------------ |
| `vite.config.ts`                | 📘 the React Compiler: what it memoizes, when it skips a component |
| `.oxlintrc.json`                | the compiler's lint rules, loaded into oxlint as a JS plugin       |
| `src/App.tsx`, `src/Header.tsx` | why these two are skipped: a suppressed hooks rule                 |

Try it: `npm run lint` shows a `react-compiler(set-state-in-effect)` warning in `Header.tsx`. That's the 2021 pattern of copying derived data into state inside an effect, which chapter 08 removes.

## Chapter 03: A typed client for the APOD Basic API

NASA moved APOD to science.nasa.gov, and the API the 2021 app used now returns placeholders (#8). This chapter moves to the replacement, NASA's APOD Basic JSON API, behind a client that checks everything it receives.

| File                            | Concepts                                                                                             |
| ------------------------------- | ---------------------------------------------------------------------------------------------------- |
| `src/lib/dates.ts`              | dates as strings; time zones; `YYMMDD` codes                                                         |
| `src/api/richText.ts`           | 📘 never render someone else's HTML directly; allow-lists; DOMParser                                 |
| `src/api/apod.ts`               | 📘 parse, don't just type; 📘 discriminated unions; typed errors; ⚠️ unchecked `res.ok`; AbortSignal |
| `src/Main.tsx`, `src/Image.tsx` | the same 2021 flow, now fed by the new client                                                        |

Try it: in the browser console of `npm run dev`, run `(await import('/src/api/apod.ts')).fetchApodDay('1995-06-15')` and look at the `ApiError` it throws: status 404, code `apod_basic_not_found`.

## Chapter 04: TanStack Query

| File                           | Concepts                                                                                                                                                             |
| ------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/api/queries.ts`           | 📘 server state is not component state; query keys; `infiniteQueryOptions`; `getNextPageParam` and the end of the archive; `select` and de-duplication; retry policy |
| `src/main.tsx`                 | 📘 providers; one QueryClient per app                                                                                                                                |
| `src/components/Feed/Feed.tsx` | `useSuspenseInfiniteQuery`; 📘 Suspense (first look); an effect that knows when to stop (⚠️ the request loop)                                                        |
| `src/App.tsx`                  | a `<Suspense>` boundary                                                                                                                                              |

Compare `Feed.tsx` with the deleted `Main.tsx` (`git diff chapter-03 chapter-04 -- src/Main.tsx src/components/Feed/Feed.tsx`).

The ⚠️ in `Feed.tsx` is a real mistake made while writing this chapter. A test of a failed page caught it: the first version re-requested a failed page in a tight loop.

## Chapter 05: Infinite scroll with IntersectionObserver

| File                           | Concepts                                                                                                                                                                |
| ------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/hooks/useInView.ts`       | ⚠️ the 2021 scroll listener and its stale closure; IntersectionObserver; 📘 callback refs with cleanup (React 19); why the compiler may make code faster, never correct |
| `src/components/Feed/Feed.tsx` | a sentinel element; the "load more" effect, now driven by the observer                                                                                                  |
| `src/App.tsx`                  | what's left once scrolling moved out: layout and shared state                                                                                                           |

Try it: open the dev tools' Performance panel and scroll. Before this chapter, every scroll event ran a handler and measured the layout. Now nothing runs until the sentinel crosses its margin.

## Chapter 06: Loading and error states

| File                                   | Concepts                                                                                         |
| -------------------------------------- | ------------------------------------------------------------------------------------------------ |
| `src/components/Feed/FeedBoundary.tsx` | 📘 Suspense and error boundaries, together; where to place a boundary; `QueryErrorResetBoundary` |
| `src/components/ErrorFallback.tsx`     | narrowing `unknown` errors; messages a reader can act on; `role="alert"`                         |
| `src/components/Feed/FeedSkeleton.tsx` | skeleton screens; `aria-busy`                                                                    |
| `src/components/Feed/Feed.tsx`         | 📘 live regions; an inline retry for a failed later page                                         |

Try it: in the dev tools' Network panel, set throttling to "Offline" and reload. The feed shows "You seem to be offline", and the header still works. Go back online and press "Try again".

## Chapter 07: Every media type

| File                                  | Concepts                                                                                                                                        |
| ------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/components/Entry/Entry.tsx`      | composition: one frame, three media parts; 📘 exhaustiveness checking with `never`; `<article>`                                                 |
| `src/components/Entry/ImageEntry.tsx` | ⚠️ toggled vs one-way state; `srcset`/`sizes`; lazy loading and `fetchPriority`; reserving space with `width`/`height`; a load-failure fallback |
| `src/components/Entry/VideoEntry.tsx` | click-to-load embeds; `youtube-nocookie.com`; iframe titles                                                                                     |
| `src/components/Entry/LinkEntry.tsx`  | graceful degradation                                                                                                                            |
| `src/components/Entry/RichText.tsx`   | rendering the parsed HTML tree recursively; when an index key is correct                                                                        |
| `src/components/Entry/DateStamp.tsx`  | derived values; `<time>`; time zones in `Intl.DateTimeFormat`                                                                                   |
| `src/components/Feed/Feed.tsx`        | ⚠️ index keys; keying by date                                                                                                                   |

Try it: open the Network panel and scroll past a video day. No request goes to YouTube until you press Play.

## Chapter 08: Favorites with useSyncExternalStore

| File                             | Concepts                                                                                                                                                                                                             |
| -------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/lib/favorites.ts`           | 📘 an external store; ⚠️ the 2021 prop-callback chain; ⚠️ uncached snapshots; validating localStorage with Zod (recursive schemas with `z.lazy`); 📘 data migrations; the `storage` event; never mutating a snapshot |
| `src/hooks/useFavorites.ts`      | `useSyncExternalStore`; tearing                                                                                                                                                                                      |
| `src/Header.tsx`                 | ⚠️ derived data copied into state by an effect, replaced by computing it during render                                                                                                                               |
| `src/components/Entry/Entry.tsx` | store data vs local UI state                                                                                                                                                                                         |

Try it: open the app in two tabs and favorite a picture in one. The count updates in both.

## Chapter 09: Routing

| File                                               | Concepts                                                                                                        |
| -------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| `src/main.tsx`                                     | 📘 client-side routing; `basename`; deep links on static hosting (hash routing vs a `404.html` fallback)        |
| `src/App.tsx`                                      | layout routes and `<Outlet>`                                                                                    |
| `src/pages/FeedPage.tsx`                           | 📘 document metadata in React 19                                                                                |
| `src/pages/DayPage.tsx`                            | `useParams`; URL parameters are input, so validate them; `useSuspenseQuery`; per-page `<title>` and description |
| `src/pages/FavoritesPage.tsx`                      | rendering from the store; one boundary per pending favorite; an effect that writes to the store                 |
| `src/pages/NotFoundPage.tsx`                       | catch-all routes; `noindex`                                                                                     |
| `index.html`                                       | why there's no static description                                                                               |
| `src/Header.tsx`, `src/components/Entry/Entry.tsx` | `<Link>` vs a button that navigates                                                                             |

Try it: open `/day/1995-06-16`, the first APOD ever.

## Chapter 10: Accessible interactions

| File                                  | Concepts                                                                                                                                                                                                                      |
| ------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/components/Entry/Entry.tsx`      | ⚠️ unnamed icon buttons; toggle buttons (`aria-pressed`) vs disclosure buttons (`aria-expanded` + `aria-controls`); `useId`; `hidden` vs CSS-collapsed content; a polite live region for confirmations; naming an `<article>` |
| `src/App.tsx`                         | 📘 focus management after client-side navigation; ⚠️ "first run" flags under StrictMode; skip links; the `<main>` landmark                                                                                                    |
| `src/Header.tsx`                      | the about disclosure; removing vs hiding an empty link                                                                                                                                                                        |
| `src/components/Entry/DateStamp.tsx`  | why not `aria-label` on `<time>`                                                                                                                                                                                              |
| `src/components/Entry/ImageEntry.tsx` | saying that a link opens a new tab                                                                                                                                                                                            |
| `src/pages/FeedPage.tsx`              | a visually hidden heading to keep the outline whole                                                                                                                                                                           |
| `src/App.css` (end)                   | `:focus-visible`, contrast, `prefers-reduced-motion`                                                                                                                                                                          |

Try it: press Tab once on any page. The first stop is "Skip to content". Then use only the keyboard to favorite a picture and open its explanation.

## Chapter 11: Jump to a date with form Actions

| File                                       | Concepts                                                                                                                                                                                                                                                                    |
| ------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/components/JumpToDate/JumpToDate.tsx` | 📘 Actions; `useActionState`; `useFormStatus` (and why it lives in a child); validating before the network; `queryClient.fetchQuery` to check and pre-fill the cache; per-call `retry`; form reset and `defaultValue`; `aria-invalid` + `aria-describedby` + `role="alert"` |
| `src/lib/dates.ts`                         | why `isArchiveDate` isn't a type guard                                                                                                                                                                                                                                      |

This chapter replaces the planned "bring your own API key" form: NASA's new APOD API needs no key. The form teaches the same React 19 features.

Try it: jump to 1995-06-18. That day has no APOD, and the form says so without leaving the page.

## Chapter 12: CSS Modules and design tokens

| File                                    | Concepts                                                              |
| --------------------------------------- | --------------------------------------------------------------------- |
| `src/styles/tokens.css`                 | 📘 design tokens; dark mode as a second set of values; `color-scheme` |
| `src/styles/global.css`                 | 📘 CSS Modules; what stays global and why                             |
| `src/styles/page.module.css`            | a module shared by several components                                 |
| `src/components/Entry/Entry.module.css` | styling state from ARIA attributes (`[aria-pressed='true']`)          |
| `src/Header.module.css`                 | the narrow-screen header, no longer fixed over the feed               |
| any `*.tsx`                             | `import styles from './X.module.css'` and `className={styles.name}`   |

The 400-line global `App.css` is gone. Each component's styles sit next to it, and deleting a component deletes its CSS.

Try it: switch your system to dark mode. Every color changes, but no component has a dark variant; only the token values change.

## Chapter 13: About text and credits

A content fix, not a code lesson. `src/Header.tsx`'s about panel credited NASA's Image of the Day gallery (a different site) and said "inifinite". It now credits APOD, its authors Robert Nemiroff and Jerry Bonnell, and links to this repository. Per-picture credits have been shown under each title since chapter 07.

## Chapter 14: Deploy to GitHub Pages

| File             | Concepts                                                                                                                              |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| `vite.config.ts` | `base` for a project site; config as a function of `command`; writing a small Vite plugin (`writeBundle`) for the `404.html` fallback |
| `package.json`   | `predeploy`/`deploy` scripts with `gh-pages`; `homepage`                                                                              |
| `src/main.tsx`   | how `basename` follows `import.meta.env.BASE_URL`                                                                                     |

Deploy with `npm run deploy`. The live demo is at https://lucidbeaming.github.io/nasa-iod/.

## Target structure

```
src/
  main.tsx                 entry: createRoot, providers
  App.tsx                  routes + layout
  api/apod.ts              fetch client, Zod schemas, error types
  api/queries.ts           TanStack Query keys and query options
  lib/dates.ts             APOD date helpers (YYMMDD codes, archive range)
  hooks/useInView.ts       IntersectionObserver via a callback ref with cleanup
  hooks/useFavorites.ts    useSyncExternalStore over localStorage
  components/Feed/         infinite list, sentinel, end of archive
  components/Entry/        ImageEntry / VideoEntry / LinkEntry
  components/Favorites/
  components/JumpToDate/   form Actions
  components/ErrorFallback.tsx
  styles/tokens.css
docs/
  CONVENTIONS.md · STACK.md · TUTORIAL.md
```
