/**
 * vite.config.ts
 *
 * WHAT: Build and dev-server configuration for Vite.
 * WHERE: Read by `npm run dev`, `npm run build` and `npm run preview`.
 * CONCEPTS: Vite plugins, the React Compiler, base paths, writing a plugin
 * READ MORE:
 *   - https://vite.dev/config/
 *   - https://react.dev/learn/react-compiler
 *   - https://vite.dev/guide/static-deploy#github-pages
 *   - https://vite.dev/guide/api-plugin
 *
 * Vite replaces Create React App, which this project used until 2021.
 * The dev server serves source files as native ES modules (no bundling),
 * so it starts instantly; `vite build` bundles for production with Rolldown.
 */
import babel from '@rolldown/plugin-babel'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import { copyFile } from 'node:fs/promises'
import { join } from 'node:path'
import { defineConfig, type Plugin } from 'vite'

/**
 * Copies the built index.html to 404.html.
 *
 * GitHub Pages serves 404.html for any path it has no file for. Since that
 * file *is* the app, a deep link like /nasa-iod/day/2026-11-22 boots the
 * app, and React Router reads the real URL and shows the right page. (See
 * the routing note in src/main.tsx for the trade-offs.)
 *
 * A Vite plugin is an object with a name and hooks into the build;
 * `writeBundle` runs after the output files are on disk.
 */
function spaFallback(): Plugin {
  let outDir = 'dist'
  return {
    name: 'spa-fallback-404',
    apply: 'build',
    configResolved(config) {
      outDir = config.build.outDir
    },
    async writeBundle() {
      await copyFile(join(outDir, 'index.html'), join(outDir, '404.html'))
    },
  }
}

// The copy of the app served by joshuacurry.dev (`npm run build:site`).
const SITE_URL = 'https://joshuacurry.dev/react/nasa-iod'
const SITE_DESCRIPTION =
  "NASA's Astronomy Picture of the Day as an infinite scroll, with favorites, permalinks and dark mode. A fully commented React 19 example."

/**
 * Adds link-preview and search tags to the built index.html.
 *
 * Each page renders its own <title> and description at runtime (see the
 * note in index.html), but crawlers and link previews often read only the
 * HTML the server sends. So this adds just the tags React never renders: the
 * canonical URL and the Open Graph tags that chat apps and social sites use
 * for previews. Only the landing page matters here: inner pages share this
 * same file, and their own titles appear once the app runs.
 *
 * `transformIndexHtml` returns tags for Vite to inject into <head>.
 */
function siteMeta(): Plugin {
  // injectTo 'head' appends to <head>, after <meta charset> and <title>.
  const og = (property: string, content: string) => ({
    tag: 'meta',
    attrs: { property, content },
    injectTo: 'head' as const,
  })
  return {
    name: 'site-meta',
    apply: 'build',
    transformIndexHtml: () => [
      { tag: 'link', attrs: { rel: 'canonical', href: SITE_URL }, injectTo: 'head' },
      og('og:title', 'NASA Image of the Day'),
      og('og:description', SITE_DESCRIPTION),
      og('og:type', 'website'),
      og('og:url', SITE_URL),
      og('og:image', `${SITE_URL}/og-image.png`),
      og('og:image:width', '1200'),
      og('og:image:height', '630'),
    ],
  }
}

// defineConfig can take a function: `command` is 'serve' for the dev server
// and 'build' for production builds (and `vite preview`, which serves them).
// `mode` is 'production' for `vite build`, or whatever `--mode` names:
// `npm run build:site` passes `--mode site`.
export default defineConfig(({ command, mode }) => ({
  // GitHub Pages serves this repository's site from /nasa-iod/, and
  // joshuacurry.dev serves its copy from /react/nasa-iod/, so built asset
  // URLs must start there. The dev server keeps "/". Vite exposes the value
  // as import.meta.env.BASE_URL, which the router uses as its basename
  // (src/main.tsx).
  base: command === 'serve' ? '/' : mode === 'site' ? '/react/nasa-iod/' : '/nasa-iod/',
  build: { outDir: mode === 'site' ? 'dist-site' : 'dist' },
  plugins: [
    // @vitejs/plugin-react compiles JSX/TSX and enables Fast Refresh: editing
    // a component re-renders it in place, keeping its state.
    react(),

    // 📘 Concept: the React Compiler
    // React re-renders a component whenever its parent does. Before the
    // compiler, keeping that cheap meant wrapping values in useMemo, functions
    // in useCallback and components in memo(), by hand, with dependency
    // arrays that were easy to get wrong. The compiler does it at build time:
    // it analyzes each component and hook, and caches every value and JSX
    // element whose inputs haven't changed since the last render.
    //
    // That's why this codebase never calls useMemo or useCallback. When you
    // read a component here, assume anything derived from props or state is
    // already memoized.
    //
    // The compiler only optimizes code that follows the Rules of React (pure
    // render, no mutation of props or state). It skips anything it can't
    // prove safe, including any component with an `eslint-disable` for a
    // hooks rule, and the `react-compiler/*` lint rules in .oxlintrc.json
    // report why. A skipped component still works; it just isn't memoized.
    //
    // It runs as a Babel preset here: babel-plugin-react-compiler is the
    // stable 1.0 release. plugin-react also offers `react({ compiler: true })`
    // using a Rust port, which is faster but still experimental.
    babel({ presets: [reactCompilerPreset()] }),

    // GitHub Pages needs the 404.html copy for deep links. joshuacurry.dev
    // has a server, which answers every path under /react/nasa-iod/ with
    // index.html itself, and the copy gets the preview tags instead.
    mode === 'site' ? siteMeta() : spaFallback(),
  ],
}))
