/**
 * src/ImageBlock.tsx
 *
 * WHAT: Renders the list of loaded entries.
 * WHERE: Rendered by Main.tsx with the accumulated list.
 * CONCEPTS: rendering lists, keys
 * READ MORE: https://react.dev/learn/rendering-lists
 *
 * Ported from 2021 without behavior changes. Chapter 07 replaces this with
 * components for every media type.
 */
import Image from './Image.tsx'
import type { ApodItem } from './types.ts'

/** Props for {@link Imageblock}. */
interface ImageblockProps {
  imageList: ApodItem[]
  setNewFav: (count: number) => void
}

/** The list of pictures. */
function Imageblock(props: ImageblockProps) {
  return (
    <div id="main-block">
      {props.imageList.map((imageItem, index) => {
        // Known bug (#11): anything that isn't an image (APOD has published
        // videos since 2010) is silently skipped, leaving gaps in the dates.
        if (imageItem.media_type === 'image') {
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
