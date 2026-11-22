/**
 * src/components/Entry/ImageEntry.tsx
 *
 * WHAT: The picture for an image entry: a responsive, lazily loaded image
 *       that links to the full-size original.
 * WHERE: Rendered by Entry.tsx when `entry.kind === 'image'`.
 * CONCEPTS: one-way state, responsive images (srcset/sizes), lazy loading,
 *           reserving space with width/height
 * READ MORE:
 *   - https://developer.mozilla.org/docs/Web/HTML/Guides/Responsive_images
 *   - https://web.dev/articles/browser-level-image-lazy-loading
 */
import { useState } from 'react'
import type { ImageEntry as ImageEntryData } from '../../api/apod.ts'

/** Widths offered to the browser. NASA's image service resizes with `?w=`. */
const WIDTHS = [480, 800, 1200, 1600, 2400]

/** Props for {@link ImageEntry}. */
interface ImageEntryProps {
  entry: ImageEntryData
  /**
   * True for the first entry on the page: it's visible immediately, so it
   * should load right away and with high priority, not lazily.
   */
  priority?: boolean
}

/** A responsive APOD image linking to the full-size version. */
export function ImageEntry({ entry, priority = false }: ImageEntryProps) {
  // ⚠️ Common mistake (from v0-2021, src/Image.js):
  //   const imageLoaded = () => setLoading(loading !== " loading" ? " loading" : "")
  // That *toggled* the placeholder: the first onLoad removed it and any
  // later one (a new src, a srcset switch on resize) put it back over a
  // loaded picture (#12). "Has loaded" is a one-way fact, so it's stored as
  // one: it only ever becomes true. The same goes for "failed".
  const [status, setStatus] = useState<'loading' | 'loaded' | 'failed'>('loading')

  // Only offer sizes up to the original's width: upscaling wastes bytes.
  const widths = entry.width ? WIDTHS.filter((w) => w <= entry.width!) : WIDTHS
  const srcSet = widths.map((w) => `${entry.imageBase}?w=${w} ${w}w`).join(', ')

  if (status === 'failed') {
    return (
      <p className="image-failed">
        The image couldn’t be loaded.{' '}
        <a href={entry.permalink} target="_blank" rel="noreferrer">
          View it on NASA’s site
        </a>
        .
      </p>
    )
  }

  return (
    <a
      href={entry.hdurl}
      className={`img-anchor${status === 'loading' ? ' loading' : ''}`}
      target="_blank"
      rel="noreferrer"
    >
      <img
        // The API's own description of the picture (#12). api/apod.ts falls
        // back to the title when an older entry only has boilerplate.
        alt={entry.alt}
        // `src` is the fallback for browsers that ignore srcset.
        src={`${entry.imageBase}?w=1200`}
        // srcset lists the available widths; `sizes` tells the browser how
        // wide the image will be displayed, so it can pick the smallest file
        // that's sharp enough for the screen's pixel density.
        srcSet={srcSet}
        sizes="(max-width: 960px) 80vw, 900px"
        // Intrinsic size lets the browser reserve the right space before the
        // file arrives, so the page doesn't jump as pictures load.
        width={entry.width ?? undefined}
        height={entry.height ?? undefined}
        // Off-screen pictures wait until the reader scrolls near them.
        loading={priority ? 'eager' : 'lazy'}
        fetchPriority={priority ? 'high' : 'auto'}
        decoding="async"
        onLoad={() => setStatus('loaded')}
        onError={() => setStatus('failed')}
      />
      {/* The link's name is the image's alt text; this adds where it goes.
          Links that open a new tab should say so (WCAG 3.2.5). */}
      <span className="visually-hidden"> (full-size image, opens in a new tab)</span>
    </a>
  )
}
