# Changelog

All notable changes to this project are documented here. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

## [1.1.0] - 2026-11-23

Adds a build of the app for joshuacurry.dev/react/nasa-iod. `nasa-iod-site-1.1.0.zip` (with its SHA-256 checksum) is that build, ready to serve from `/react/nasa-iod/`. The GitHub Pages demo is unchanged.

### Added

- `npm run build:site` and `npm run package:site`: a copy of the app for joshuacurry.dev/react/nasa-iod, with a canonical URL, Open Graph tags and a preview image, zipped with a checksum for each release (#49)

## [1.0.1] - 2026-11-23

### Changed

- Relicensed from GPL-3.0 to MIT; release 1.0.0 keeps GPL-3.0 (#47)

## [1.0.0] - 2026-11-22

The textbook rewrite of the 2021 exercise, in 16 chapters. Each is one pull request and one tag (`chapter-00` … `chapter-15`); see [docs/TUTORIAL.md](docs/TUTORIAL.md).

### Added

- Typed client for NASA's APOD Basic API, with Zod validation and safe rendering of its HTML (chapter 03)
- Every media type: responsive images, click-to-load videos, a link for anything else (chapter 07)
- Favorites page and store, synced across tabs, with migration of 2021 favorites (chapters 08–09)
- Permalinks for every day, with per-page titles and descriptions (chapter 09)
- Jump to a date (chapter 11)
- Dark mode and a reworked narrow-screen layout (chapter 12)
- Live demo on GitHub Pages (chapter 14)
- Tutorial, conventions and stack docs; README (chapters 00, 15)

### Changed

- Create React App 5 / React 17 → Vite 8, React 19, TypeScript 7, React Compiler, oxlint, Prettier (chapters 01–02)
- Server state in TanStack Query; infinite scroll by IntersectionObserver (chapters 04–05)
- Styles in CSS Modules with design tokens (chapter 12)
- Licensed under GPL-3.0 (#44)

### Fixed

- Placeholder images: the retired api.nasa.gov endpoint replaced (#8)
- Endless loader after a failed request (#9)
- Double fetches, a stale window height, and no end to the archive (#10)
- Video days dropped from the feed (#11)
- Toggling placeholder, generic alt text, unlabeled buttons (#12)

### Security

- Resolved the 16 high npm advisories from `react-scripts` (#7)

## [0-2021]

The original coding exercise: tag [`v0-2021`](https://github.com/lucidbeaming/nasa-iod/tree/v0-2021).

[Unreleased]: https://github.com/lucidbeaming/nasa-iod/compare/v1.1.0...HEAD
[1.1.0]: https://github.com/lucidbeaming/nasa-iod/compare/v1.0.1...v1.1.0
