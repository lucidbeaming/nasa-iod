/**
 * src/ImageBlock.tsx
 *
 * WHAT: Renders the list of loaded entries.
 * WHERE: Rendered by components/Feed/Feed.tsx with the loaded list.
 * CONCEPTS: rendering lists, keys
 * READ MORE: https://react.dev/learn/rendering-lists
 *
 * Ported from 2021. Chapter 07 replaces this with components for every
 * media type.
 */
import Image from './Image.tsx'
import type { ApodEntry } from './api/apod.ts'

/** Props for {@link Imageblock}. */
interface ImageblockProps {
  imageList: ApodEntry[]
  setNewFav: (count: number) => void
}

/** The list of pictures. */
function Imageblock(props: ImageblockProps) {
  return (
    <div id="main-block">
      {props.imageList.map((imageItem, index) => {
        // Known bug (#11): anything that isn't an image (APOD has published
        // videos since 2010) is silently skipped, leaving gaps in the dates.
        // Checking `kind` narrows the union, so <Image> receives an
        // ImageEntry (see 📘 discriminated unions in api/apod.ts).
        if (imageItem.kind === 'image') {
          // ⚠️ Keys: an array index is a poor key because it describes a
          // position, not an item. If items are inserted or removed, React
          // matches the wrong component state to the wrong picture. Each
          // APOD has a unique date, which chapter 07 uses instead (#12).
          return <Image imgData={imageItem} key={index} setNewFav={props.setNewFav} />
        }
        return null
      })}
    </div>
  )
}

export default Imageblock
