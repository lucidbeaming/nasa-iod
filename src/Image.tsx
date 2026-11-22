/**
 * src/Image.tsx
 *
 * WHAT: One picture: the image, its title, favorite and info buttons, a
 *       collapsible explanation, and a calendar-style date stamp.
 * WHERE: Rendered by ImageBlock.tsx, once per image entry.
 * CONCEPTS: local UI state, event handlers, writing to localStorage
 * READ MORE: https://react.dev/learn/responding-to-events
 *
 * Ported from 2021. Chapter 03 switched it to the new API's fields (a resized
 * image, the full-size link, a plain-text explanation). Chapter 07 rewrites
 * it as ImageEntry; chapter 08 moves favorites into a shared store.
 */
import { useState } from 'react'
import { plainExplanation, type ImageEntry } from './api/apod.ts'

/** Props for {@link Image}. */
interface ImageProps {
  imgData: ImageEntry
  /** Reports the new favorites count up to App. */
  setNewFav: (count: number) => void
}

/** One APOD image with its title bar and date stamp. */
function Image(props: ImageProps) {
  // toUTCString() gives "Sat, 20 Nov 2021 00:00:00 GMT"; splitting on spaces
  // yields [weekday, day, month, year, ...].
  const splitDate = (date: string) => {
    const picDate = new Date(date)
    return picDate.toUTCString().split(' ')
  }
  const [, day = '', month, year] = splitDate(props.imgData.date)

  const [collapsed, setCollapsed] = useState(' collapsed')
  const [loading, setLoading] = useState(' loading')
  const [savedFav, setSavedFav] = useState('')

  const toggleAbout = () => {
    if (collapsed !== ' collapsed') {
      setCollapsed(' collapsed')
    } else {
      setCollapsed('')
    }
  }

  // Known bug (#12): this *toggles* the placeholder class. The first onLoad
  // removes it, but any later onLoad (for example when the src changes) puts
  // the placeholder back over a loaded image. "Loaded" is a one-way fact, so
  // chapter 07 stores it as `setLoaded(true)`, never a flip.
  const imageLoaded = () => {
    if (loading !== ' loading') {
      setLoading(' loading')
    } else {
      setLoading('')
    }
  }

  const setFavorite = (date: string) => {
    let favArr = JSON.parse(localStorage.getItem('nasaPics') ?? 'null') as string[] | null
    if (favArr !== null) {
      if (favArr.indexOf(date) === -1) {
        favArr.push(date)
        props.setNewFav(favArr.length)
        setSavedFav('Saved in favorites')
      } else {
        setSavedFav('Already saved')
      }
    } else {
      favArr = [date]
      props.setNewFav(favArr.length)
      setSavedFav('Your first favorite!')
    }
    localStorage.setItem('nasaPics', JSON.stringify(favArr))
  }

  return (
    <div className="image-block">
      <div className="image-block-left">&nbsp;</div>
      <div className="image-block-inner">
        <a href={props.imgData.hdurl} className={`img-anchor${loading}`}>
          {/* Known bug (#12): every image gets the same alt text, so a screen
              reader user hears the same sentence for every picture. */}
          <img
            // The full-size image can be several megabytes; the image service
            // resizes on request. Chapter 07 adds a srcset for other widths.
            src={`${props.imgData.imageBase}?w=1200`}
            alt="astronomical depiction of outer space"
            title={props.imgData.title}
            onLoad={imageLoaded}
          />
        </a>
        <div className="title-bar">
          <h3>{props.imgData.title}</h3>
          <div className="toolbox">
            <span className="fav-message">{savedFav}</span>
            {/* Known bug (#12): "*" and "?" are announced literally ("star",
                "question mark") with no hint of what they do. Chapter 10 adds
                accessible names and pressed/expanded state. */}
            <button className="fav-toggle" onClick={() => setFavorite(props.imgData.date)}>
              *
            </button>
            <button className="info-toggle" onClick={toggleAbout}>
              ?
            </button>
          </div>
          <div className={`caption-box${collapsed}`}>
            {/* Plain text for now; chapter 07 renders the links (RichText). */}
            <p>{plainExplanation(props.imgData)}</p>
          </div>
        </div>
      </div>
      <div className="image-block-right">
        <div className="calendar-stamp">
          <div className="month">{month}</div>
          <div className="day">{parseInt(day, 10)}</div>
          <div className="year">{year}</div>
        </div>
      </div>
    </div>
  )
}

export default Image
