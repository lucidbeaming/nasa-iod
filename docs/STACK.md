# Stack

Every dependency in this project has to earn its place. Each section below covers **why it's used**, **what you'd write in plain React instead**, and **when you wouldn't need it**. Sections are added by the chapter that introduces the dependency.

The dependency list is deliberately short. If a browser API or a React built-in does the job, that's what the code uses.

## Data source

NASA's [APOD Basic JSON API](https://api.nasa.gov/assets/files/apod/APOD-APIs-and-RSS-info.pdf) at `https://science.nasa.gov/wp-json/wp/v2/apod-basic`. It needs no API key. The older `api.nasa.gov/planetary/apod` endpoint, which the 2021 version used, has returned placeholder data since APOD moved to science.nasa.gov (see #8).

## Build and language

### Vite (`vite`, `@vitejs/plugin-react`)

**Why:** the dev server serves source files as native ES modules, so it starts instantly and updates a single module on save (Fast Refresh keeps component state). `vite build` bundles for production. It replaced Create React App, which the React team deprecated in February 2025.

**Plain alternative:** there isn't a dependency-free way to compile TSX. The closest is running `esbuild` or `tsc` directly and writing your own dev server and HTML handling.

**When you wouldn't need it:** if you use a framework (React Router framework mode, Next.js), it brings its own build tool. Vite is the choice for a client-only single-page app like this one.

### TypeScript (`typescript`, `@types/react`, `@types/react-dom`, `@types/node`)

**Why:** props, API responses and hook return values are checked as you type, and editors can autocomplete them. TypeScript 7 is the native (Go) compiler, roughly 10× faster than 5.x. `strict` mode is on.

**Plain alternative:** JavaScript with JSDoc comments, checked by `tsc --checkJs`. It works, but the annotations are noisier.

**When you wouldn't need it:** a throwaway prototype. For anything someone else will read, and a textbook especially, types are documentation the compiler keeps honest.

Remember that types disappear at runtime: see 📘 parse, don't just type in `src/api/apod.ts`, and Zod below.

### oxlint (`oxlint`)

**Why:** it catches broken rules of hooks (`react/rules-of-hooks`) and missing effect dependencies (`react/exhaustive-deps`) before they become bugs, and it's what the current official Vite template ships. It's written in Rust and lints this project in milliseconds.

**Plain alternative:** ESLint with `eslint-plugin-react-hooks` does the same job and has a larger rule ecosystem. It's slower, and typescript-eslint doesn't support TypeScript 7 yet.

**When you wouldn't need it:** never, really. The hook rules alone are worth it.

### Prettier (`prettier`)

**Why:** one formatting style, applied automatically, so diffs show changes in logic rather than whitespace. That matters in a repo meant to be read chapter by chapter.

**Plain alternative:** an `.editorconfig` and discipline.

**When you wouldn't need it:** if your editor or linter already formats (oxc's `oxfmt`, Biome).

## React Compiler

### React Compiler (`babel-plugin-react-compiler`, `@rolldown/plugin-babel`, `@babel/core`, `eslint-plugin-react-hooks`)

**Why:** it memoizes components, values and callbacks at build time, so the code never needs hand-written `useMemo`, `useCallback` or `memo()`, and their dependency arrays can't go stale. Its lint rules (from `eslint-plugin-react-hooks` 7, loaded into oxlint as a JS plugin under the alias `react-compiler`) report code that breaks the Rules of React, which is also code the compiler refuses to optimize.

**Plain alternative:** memoize by hand where profiling shows a slow render, or not at all. Most apps this size are fast enough without any memoization.

**When you wouldn't need it:** for a small app, the speed gain is modest. It's here because it's how current React is meant to be written, and because its lint rules catch real mistakes. (oxlint's JS plugin support is alpha; if it breaks, drop the `jsPlugins` entry and the `react-compiler/*` rules, and the build is unaffected.)

**Babel vs Rust:** `@vitejs/plugin-react` can also run the compiler's experimental Rust port with `react({ compiler: true })`. This project uses the stable Babel plugin (1.0).

## Runtime validation

### Zod (`zod`)

**Why:** API responses are checked when they arrive, and the TypeScript types are inferred from the same schemas, so the check and the type can't drift apart. Schemas also _transform_: `api/apod.ts` turns NASA's flat response into the app's `ApodEntry` union, and its HTML fields into safe RichText. Zod 4 is small, has no dependencies, and gives readable errors (`z.prettifyError`).

**Plain alternative:** hand-written type guards (`function isEntry(x: unknown): x is ApodEntry`). That's fine for one or two shapes, but it means writing every check twice, once as code and once as a type.

**When you wouldn't need it:** when the data comes from code you control and is already typed, such as a typed RPC client generated from the server's schema.

## Server state

### TanStack Query (`@tanstack/react-query`)

**Why:** the feed is server state: NASA owns it, it can fail or go stale, and it arrives in pages. TanStack Query caches it per query key, gives each fetch an `AbortSignal`, de-duplicates concurrent requests, retries failures by a policy (here: never on 4xx), and tracks loading, paging and error status consistently. `useSuspenseInfiniteQuery` handles the paging, and `hasNextPage` handles the end of the archive. The 2021 app's two worst bugs (#9, #10) were hand-rolled versions of exactly this.

**Plain alternative:** `useEffect` + `useState` + `fetch`, with your own abort handling, de-duplication, retries and cache. React's own `use()` can read a promise, but you still have to cache that promise yourself. Feasible for one request; a lot of subtle code for paging.

**When you wouldn't need it:** if the data comes from a framework loader (React Router framework mode, Next.js server components), the framework does the fetching. Or when there's a single request with no paging or refetching.

The devtools (`@tanstack/react-query-devtools`) are worth adding while developing; they're left out here to keep the dependency list short.

## Error boundaries

### react-error-boundary (`react-error-boundary`)

**Why:** React catches rendering errors only in _class_ components that implement `getDerivedStateFromError`; there's no hook for it. This tiny package is that class, with a `FallbackComponent` prop and a `resetErrorBoundary` callback. Paired with TanStack Query's `QueryErrorResetBoundary`, "Try again" clears both the boundary and the failed query.

**Plain alternative:** write the ~30-line class yourself (React's docs show one). It's the same thing, minus the reset helpers.

**When you wouldn't need it:** frameworks with route-level error handling (React Router's `errorElement`, Next.js `error.tsx`) provide their own boundaries.

## Routing

_Chapter 09: React Router._

## Deployment

_Chapter 14: gh-pages._

## Not included: tests

Tests are out of scope for this round. When they're added, they belong in:

- `src/**/*.test.ts` for the pure modules (`api/apod.ts` parsing, `lib/dates.ts`), using Vitest, which shares Vite's config.
- `src/**/*.test.tsx` for components, using Testing Library, with the APOD API mocked at the network layer (Mock Service Worker) rather than by mocking modules.
