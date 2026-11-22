/**
 * src/api/richText.ts
 *
 * WHAT: Turns the small amount of HTML in APOD's text fields (links, bold,
 *       italics, line breaks) into a plain data structure React can render
 *       safely.
 * WHERE: Called by the Zod schemas in api/apod.ts while parsing a response.
 *        Rendered by the RichText component in chapter 07.
 * CONCEPTS: untrusted HTML, allow-lists, DOMParser
 * READ MORE:
 *   - https://developer.mozilla.org/docs/Web/API/DOMParser
 *   - https://react.dev/reference/react-dom/components/common#dangerously-setting-the-inner-html
 *
 * 📘 Concept: never render someone else's HTML directly
 * The API's `explanation` and `credit` fields contain HTML such as
 * `<a href="…">Beehive cluster</a>`. The quick way to show it is
 * `<p dangerouslySetInnerHTML={{ __html: explanation }} />`, and the name
 * is the warning: if that HTML ever contained `<img onerror="…">` or a
 * `javascript:` link, it would run in our page with our page's permissions.
 * We trust NASA, but the safe habit is to treat every external string as
 * data. This file keeps only an allow-list of harmless elements (text, line
 * breaks, bold, italic, and links with http(s) URLs) and drops everything
 * else, so the UI never needs dangerouslySetInnerHTML at all.
 */

/** One piece of formatted text. A tree, because a link can contain bold text. */
export type RichNode =
  | { type: 'text'; text: string }
  | { type: 'break' }
  | { type: 'strong'; children: RichNode[] }
  | { type: 'em'; children: RichNode[] }
  | { type: 'link'; href: string; children: RichNode[] }

/** Formatted text: a list of nodes. */
export type RichText = RichNode[]

/** Returns `href` as an absolute http(s) URL, or null for anything else. */
function safeHref(href: string | null): string | null {
  if (!href) return null
  try {
    // The base resolves relative links the way they'd resolve on NASA's site.
    const url = new URL(href, 'https://science.nasa.gov/')
    return url.protocol === 'https:' || url.protocol === 'http:' ? url.href : null
  } catch {
    return null
  }
}

const DROP_WITH_CONTENTS = new Set(['SCRIPT', 'STYLE', 'NOSCRIPT', 'TEMPLATE', 'IFRAME', 'OBJECT'])

function convert(nodes: NodeListOf<ChildNode>): RichText {
  const out: RichText = []
  for (const node of nodes) {
    if (node.nodeType === Node.TEXT_NODE) {
      // DOMParser has already decoded entities such as &amp; into characters.
      // Runs of whitespace (including the source's line breaks) collapse to
      // one space, the way a browser would display them.
      const text = (node.textContent ?? '').replace(/\s+/g, ' ')
      if (text) out.push({ type: 'text', text })
      continue
    }
    if (!(node instanceof Element)) continue
    // Elements whose text isn't prose (a script's code, a style sheet) are
    // dropped together with their contents.
    if (DROP_WITH_CONTENTS.has(node.tagName)) continue
    const children = convert(node.childNodes)
    switch (node.tagName) {
      case 'BR':
        out.push({ type: 'break' })
        break
      case 'B':
      case 'STRONG':
        out.push({ type: 'strong', children })
        break
      case 'I':
      case 'EM':
        out.push({ type: 'em', children })
        break
      case 'A': {
        const href = safeHref(node.getAttribute('href'))
        // A link we won't follow keeps its text, without the link.
        if (href) out.push({ type: 'link', href, children })
        else out.push(...children)
        break
      }
      default:
        // Any other element (span, p, img…) is unwrapped: the element goes,
        // its text stays, so no words go missing.
        out.push(...children)
    }
  }
  return out
}

/**
 * Parses an HTML fragment into {@link RichText}.
 *
 * DOMParser builds an inert document: scripts don't run and images don't
 * load while it's parsed, which makes it safe to inspect untrusted HTML.
 */
export function parseRichText(html: string): RichText {
  const doc = new DOMParser().parseFromString(html, 'text/html')
  return trimEdges(convert(doc.body.childNodes))
}

/**
 * Removes whitespace at the very start and end, including inside a leading
 * or trailing element (credits start with a bold label like "<b> Credits: </b>").
 */
function trimEdges(nodes: RichText, start = true, end = true): RichText {
  const result = nodes.map((n, i) => {
    const atStart = start && i === 0
    const atEnd = end && i === nodes.length - 1
    if (n.type === 'text') {
      let text = n.text
      if (atStart) text = text.trimStart()
      if (atEnd) text = text.trimEnd()
      return { ...n, text }
    }
    if ('children' in n && (atStart || atEnd)) {
      return { ...n, children: trimEdges(n.children, atStart, atEnd) }
    }
    return n
  })
  return result.filter((n) => n.type !== 'text' || n.text !== '')
}

/** Flattens {@link RichText} to plain text, e.g. for an `alt` attribute or a `<title>`. */
export function toPlainText(nodes: RichText): string {
  return nodes
    .map((n) => {
      switch (n.type) {
        case 'text':
          return n.text
        case 'break':
          return '\n'
        default:
          return toPlainText(n.children)
      }
    })
    .join('')
}

/**
 * Finds the video embed URL in an APOD's `basic_html` document.
 *
 * For videos, the API's `hdurl` is a generic thumbnail; the real player URL
 * only appears as an `<iframe src>` (YouTube, Vimeo) or a `<video>` source
 * inside `basic_html`.
 *
 * @returns an absolute https URL, or null if there's no embed.
 */
export function findEmbedUrl(html: string): string | null {
  const doc = new DOMParser().parseFromString(html, 'text/html')
  const el = doc.querySelector('iframe[src], video[src], video source[src]')
  const src = el?.getAttribute('src')
  // Embeds are often protocol-relative ("//www.youtube.com/embed/…").
  const href = src ? safeHref(src.startsWith('//') ? 'https:' + src : src) : null
  return href?.startsWith('https:') ? href : null
}
