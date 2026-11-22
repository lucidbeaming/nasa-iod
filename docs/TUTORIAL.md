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
