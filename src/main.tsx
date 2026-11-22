/**
 * src/index.tsx
 *
 * WHAT: The entry point. Finds the empty <div id="root"> in index.html and
 *       hands it to React.
 * WHERE: Loaded by the <script type="module"> tag in index.html. Everything
 *        else is imported from here.
 * CONCEPTS: createRoot, StrictMode
 * READ MORE:
 *   - https://react.dev/reference/react-dom/client/createRoot
 *   - https://react.dev/reference/react/StrictMode
 */
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// ⚠️ Common mistake (from v0-2021, src/index.js):
//   ReactDOM.render(<App />, document.getElementById('root'))
// ReactDOM.render was the React 17 API. It was deprecated in React 18 and
// removed in React 19, so the old entry point fails at startup. createRoot
// is its replacement, and it's what turns on React 18+ features such as
// automatic batching and concurrent rendering.
const container = document.getElementById('root')

// getElementById returns `HTMLElement | null`, and strict TypeScript won't let
// us pass a possible null to createRoot. Failing loudly here is better than a
// confusing error from inside React.
if (!container) {
  throw new Error('index.html is missing <div id="root">')
}

createRoot(container).render(
  // 📘 Concept: StrictMode
  // In development only, StrictMode renders every component twice and runs
  // every effect's setup → cleanup → setup once more. That surfaces code that
  // isn't safe to re-run (a missing cleanup, a mutation during render) while
  // you're writing it, instead of in production. It has no effect in builds.
  <StrictMode>
    <App />
  </StrictMode>,
)
