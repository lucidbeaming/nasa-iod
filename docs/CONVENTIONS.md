# Conventions

This repository is a **textbook**. The app (an infinite-scrolling feed of NASA's Astronomy Picture of the Day) is small, and that's the point: it's big enough to need real answers about data fetching, state, routing, errors and accessibility, and small enough to read in one sitting.

Most codebases keep comments short and let the code speak. This one deliberately doesn't. The comments are the lesson, and the rules below keep them consistent.

## Comments

### 1. File header

Every source file starts with a block comment that answers four questions:

```ts
/**
 * src/hooks/useInView.ts
 *
 * WHAT: Reports when an element scrolls into view.
 * WHERE: Used by <Feed> to load the next page when the sentinel at the
 *        bottom of the list becomes visible.
 * CONCEPTS: callback refs, ref cleanup functions (React 19), IntersectionObserver
 * READ MORE:
 *   - https://react.dev/reference/react-dom/components/common#ref-callback
 *   - https://developer.mozilla.org/docs/Web/API/Intersection_Observer_API
 */
```

### 2. Every hook call is explained

Say **why this hook**, what each argument or option means, and **what would go wrong without it**. A reader should never have to guess why a dependency array contains what it does.

```ts
// useSyncExternalStore subscribes a component to a store React doesn't own
// (here, localStorage). Plain useState + useEffect would show stale data for
// one render and could "tear" (two components showing different values).
const favorites = useSyncExternalStore(subscribe, getSnapshot)
```

### 3. 📘 Concept blocks

The **first** time an idea appears, explain it in a `📘 Concept` block. Later files refer back to it instead of repeating it ("see 📘 Suspense in `Feed.tsx`").

```ts
// 📘 Concept: Suspense
// A component can "suspend" while its data loads. React then shows the nearest
// <Suspense fallback> above it instead...
```

### 4. ⚠️ Common mistake callouts

The original 2021 version of this app (tag [`v0-2021`](https://github.com/lucidbeaming/nasa-iod/tree/v0-2021)) had real bugs. Each one becomes a lesson where its fix lands: quote the old code, say what went wrong, and show why the new code avoids it.

```ts
// ⚠️ Common mistake (from v0-2021, src/App.js):
//   useLayoutEffect(() => { window.addEventListener("scroll", isScrolling) }, [])
// The empty dependency array froze `winHeight` at its first value...
```

### 5. TSDoc on every export

Every exported function, hook, component and type gets a `/** … */` comment: what it does, its parameters, and what it returns or renders. Editors show these on hover, so they double as inline documentation.

### 6. Explain _why_, not _what_

`// increment the counter` above `count++` teaches nothing. Explain the decision: why this approach, what the alternative was, and what breaks if you change it.

### 7. Comments must match the code

A wrong comment is worse than none. Every pull request checklist includes "comments still match the code".

## Code style

- TypeScript in strict mode. No `any`; parse unknown data with Zod at the boundary (chapter 03).
- Function components and hooks only.
- No hand-written `useMemo`/`useCallback`/`memo`: the React Compiler handles memoization (chapter 02).
- Formatting by Prettier (`npm run format`); linting by oxlint (`npm run lint`). Both must pass before merging.
- File names: `PascalCase.tsx` for components, `camelCase.ts` for everything else. One component per file.

## Git workflow

Every chapter follows the same flow, so the history reads like the book:

1. **Issue**: one issue per chapter (`Chapter NN: …`), plus `bug` issues for the original defects.
2. **Branch**: `<type>/<issue>-<slug>`, for example `feat/17-infinite-query`.
3. **Commits**: [Conventional Commits](https://www.conventionalcommits.org/) (`feat:`, `fix:`, `docs:`, `chore:`, `refactor:`, `style:`), each ending with `Refs #<issue>`.
4. **Pull request**: `Closes #<chapter issue>`, plus `Closes #<bug>` for any bug the chapter fixes.
5. **Tag**: after merging, the merge commit is tagged `chapter-NN`.

To see the app at any stage, check out its tag:

```bash
git checkout chapter-05
npm install
npm run dev
```
