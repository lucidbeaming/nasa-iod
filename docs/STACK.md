# Stack

Every dependency in this project has to earn its place. Each section below covers **why it's used**, **what you'd write in plain React instead**, and **when you wouldn't need it**. Sections are added by the chapter that introduces the dependency.

The dependency list is deliberately short. If a browser API or a React built-in does the job, that's what the code uses.

## Data source

NASA's [APOD Basic JSON API](https://api.nasa.gov/assets/files/apod/APOD-APIs-and-RSS-info.pdf) at `https://science.nasa.gov/wp-json/wp/v2/apod-basic`. It needs no API key. The older `api.nasa.gov/planetary/apod` endpoint, which the 2021 version used, has returned placeholder data since APOD moved to science.nasa.gov (see #8).

## Build and language

_Chapter 01: Vite, TypeScript, oxlint, Prettier._

## React Compiler

_Chapter 02._

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
