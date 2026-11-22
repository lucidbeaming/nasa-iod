/**
 * vite.config.ts
 *
 * WHAT: Build and dev-server configuration for Vite.
 * WHERE: Read by `npm run dev`, `npm run build` and `npm run preview`.
 * CONCEPTS: Vite plugins, the React Compiler
 * READ MORE:
 *   - https://vite.dev/config/
 *   - https://react.dev/learn/react-compiler
 *
 * Vite replaces Create React App, which this project used until 2021.
 * The dev server serves source files as native ES modules (no bundling),
 * so it starts instantly; `vite build` bundles for production with Rolldown.
 */
import babel from '@rolldown/plugin-babel'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
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
  ],
})
