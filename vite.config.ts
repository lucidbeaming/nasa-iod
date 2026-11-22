/**
 * vite.config.ts
 *
 * WHAT: Build and dev-server configuration for Vite.
 * WHERE: Read by `npm run dev`, `npm run build` and `npm run preview`.
 * CONCEPTS: Vite plugins
 * READ MORE: https://vite.dev/config/
 *
 * Vite replaces Create React App, which this project used until 2021.
 * The dev server serves source files as native ES modules (no bundling),
 * so it starts instantly; `vite build` bundles for production with Rolldown.
 */
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  // @vitejs/plugin-react compiles JSX/TSX and enables Fast Refresh: editing a
  // component re-renders it in place, keeping its state.
  plugins: [react()],
})
