/**
 * src/hooks/useInView.ts
 *
 * WHAT: Reports whether an element is in (or near) the viewport.
 * WHERE: Used by components/Feed/Feed.tsx on a "sentinel" element after the
 *        last entry: when the sentinel comes near, the next page loads.
 * CONCEPTS: IntersectionObserver, callback refs, ref cleanup functions
 *           (React 19), stale closures
 * READ MORE:
 *   - https://developer.mozilla.org/docs/Web/API/Intersection_Observer_API
 *   - https://react.dev/reference/react-dom/components/common#ref-callback
 *   - https://react.dev/learn/synchronizing-with-effects
 *
 * ⚠️ Common mistake (from v0-2021, src/App.js):
 *   const [winHeight, setWinHeight] = useState(window.innerHeight)
 *   useLayoutEffect(() => {
 *     const isScrolling = () => {
 *       const bottom = document.getElementById('iod').getBoundingClientRect().bottom - winHeight
 *       ...
 *     }
 *     window.addEventListener("scroll", isScrolling)
 *     ...
 *   }, [])
 * Two problems. First, a *stale closure*: a function remembers the variables
 * of the render that created it. The effect ran once (`[]`), so isScrolling
 * saw the first render's `winHeight` forever; resizing the window updated
 * the state, but never the listener's copy of it (#10). The usual fix is to
 * list `winHeight` as a dependency so the effect re-subscribes with the new
 * value, which is what the exhaustive-deps lint rule asks for.
 *
 * Second, it's the wrong tool. A scroll listener runs on every scroll event
 * (dozens per second) and forces a layout measurement each time. The browser
 * already knows when an element approaches the viewport, and an
 * IntersectionObserver asks it to say so: no scroll events, no measuring,
 * no window height to keep in sync. The stale value disappears because
 * there's no value left to go stale.
 */
import { useState } from 'react'

/**
 * Observes an element and reports whether it's within `rootMargin` of the
 * viewport.
 *
 * @param rootMargin - how far outside the viewport counts as "in view", in
 *   CSS margin syntax. `'0px 0px 200% 0px'` reaches two viewport heights
 *   below the screen, matching the 2021 app's "within 2× the window
 *   height", so the next page starts loading well before it's needed.
 * @returns `[ref, inView]`: pass `ref` to the element's `ref` prop.
 *
 * @example
 *   const [sentinelRef, nearBottom] = useInView('0px 0px 200% 0px')
 *   return <div ref={sentinelRef} />
 */
export function useInView(rootMargin = '0px') {
  const [inView, setInView] = useState(false)

  // 📘 Concept: callback refs with cleanup (React 19)
  // A ref can be a function instead of a useRef object. React calls it with
  // the DOM node once the element is attached. Since React 19, the function
  // can return a cleanup, which React calls when the element is detached or
  // the callback changes. That's a natural fit for an observer: create it
  // when the node appears, disconnect it when the node goes away.
  //
  // Why not useRef + useEffect? An effect runs after every render that
  // changes its dependencies, but it can't tell when the *element* changes.
  // The feed's sentinel only exists while there's another page to load and
  // the last request didn't fail (see Feed.tsx), so it comes and goes. An
  // effect keyed on a ref object wouldn't re-run when the node appears or
  // disappears. A callback ref is called for exactly the node that's
  // attached, every time.
  //
  // The React Compiler keeps this function the same between renders until
  // `rootMargin` changes, so React doesn't disconnect and reconnect the
  // observer on every render. The code is still *correct* without the
  // compiler, only less efficient: a new callback means a new observer,
  // which reports the same value, so state doesn't change and nothing loops.
  // That's the rule for the compiler: it may make code faster, never
  // correct. (Without it, this is where you'd reach for useCallback.)
  const ref = (node: Element | null) => {
    if (!node) return
    const observer = new IntersectionObserver(
      // The callback receives one entry per observed element; there's one.
      ([entry]) => setInView(entry?.isIntersecting ?? false),
      { rootMargin },
    )
    observer.observe(node)
    // No state update here: a new observer reports the element's current
    // state as soon as it starts observing, so `inView` corrects itself.
    // (Setting state in this cleanup would re-render, which, without the
    // compiler, would create a new callback, run this cleanup again, and
    // loop.)
    return () => observer.disconnect()
  }

  return [ref, inView] as const
}
