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

Remember that types disappear at runtime: see the 📘 in `src/types.ts`, and Zod in chapter 03.

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

_Chapter 03: Zod._

## Server state

_Chapter 04: TanStack Query._

## Error boundaries

_Chapter 06: react-error-boundary._

## Routing

_Chapter 09: React Router._

## Deployment

_Chapter 14: gh-pages._

## Not included: tests

Tests are out of scope for this round. When they're added, they belong in:

- `src/**/*.test.ts` for the pure modules (`api/apod.ts` parsing, `lib/dates.ts`), using Vitest, which shares Vite's config.
- `src/**/*.test.tsx` for components, using Testing Library, with the APOD API mocked at the network layer (Mock Service Worker) rather than by mocking modules.
