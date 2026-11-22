/**
 * src/components/Entry/RichText.tsx
 *
 * WHAT: Renders RichText (the parsed, allow-listed form of APOD's HTML
 *       fields) as React elements.
 * WHERE: Used by Entry.tsx for each entry's explanation and credit.
 * CONCEPTS: recursive components, rendering a tagged union, keys for
 *           static lists
 * READ MORE: https://react.dev/learn/rendering-lists
 *
 * The parsing (and the reason for it) is in api/richText.ts: see 📘 never
 * render someone else's HTML directly. By the time data reaches this
 * component, it can only contain text, line breaks, bold, italics and
 * http(s) links, so rendering it is simple and safe.
 */
import type { RichNode, RichText as RichTextNodes } from '../../api/richText.ts'

/** Renders one node, recursing into its children. */
function Node({ node }: { node: RichNode }) {
  // A `switch` on the discriminant narrows `node` in each case, so
  // `node.href` is only readable where node.type is 'link'.
  switch (node.type) {
    case 'text':
      return node.text
    case 'break':
      return <br />
    case 'strong':
      return (
        <strong>
          <RichText nodes={node.children} />
        </strong>
      )
    case 'em':
      return (
        <em>
          <RichText nodes={node.children} />
        </em>
      )
    case 'link':
      return (
        // Links lead off this site, to sources the APOD authors chose.
        // rel="noreferrer" keeps the URL of this page private from them.
        <a href={node.href} target="_blank" rel="noreferrer">
          <RichText nodes={node.children} />
        </a>
      )
  }
}

/** Renders a list of RichText nodes. */
export function RichText({ nodes }: { nodes: RichTextNodes }) {
  // The nodes never reorder: they're a fixed sequence parsed from one
  // string. That's the one case where an array index is a correct key.
  return nodes.map((node, i) => <Node node={node} key={i} />)
}
