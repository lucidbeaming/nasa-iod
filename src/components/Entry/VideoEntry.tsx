/**
 * src/components/Entry/VideoEntry.tsx
 *
 * WHAT: The player for a video entry. Nothing from the video host loads
 *       until the reader presses Play.
 * WHERE: Rendered by Entry.tsx when `entry.kind === 'video'`.
 * CONCEPTS: click-to-load ("facade") embeds, iframe accessibility, privacy
 * READ MORE:
 *   - https://developer.chrome.com/docs/lighthouse/performance/third-party-facades
 *   - https://developer.mozilla.org/docs/Web/HTML/Element/iframe
 *
 * The 2021 app dropped video days entirely (#11). APOD has published videos
 * since 2010, mostly YouTube embeds.
 */
import { useState } from 'react'
import type { VideoEntry as VideoEntryData } from '../../api/apod.ts'

/**
 * Prepares an embed URL for playback after a click: privacy-enhanced
 * YouTube, and autoplay, since the click already expressed the intent.
 */
function playerUrl(embedUrl: string): string {
  const url = new URL(embedUrl)
  // youtube-nocookie.com is YouTube's own privacy-enhanced embed domain: no
  // tracking cookies until the viewer interacts with the player.
  if (url.hostname === 'www.youtube.com' || url.hostname === 'youtube.com') {
    url.hostname = 'www.youtube-nocookie.com'
  }
  url.searchParams.set('autoplay', '1')
  return url.href
}

/** True if the URL points at a video file rather than a player page. */
const isVideoFile = (url: string) => /\.(mp4|webm|mov)(\?|$)/i.test(url)

/** A click-to-load video player. */
export function VideoEntry({ entry }: { entry: VideoEntryData }) {
  // Not playing until asked. A YouTube iframe loads around a megabyte of
  // scripts and sets cookies; with a page of 25 entries, embedding every
  // video up front would cost more than all the pictures together.
  const [playing, setPlaying] = useState(false)

  if (!playing) {
    return (
      <button type="button" className="video-facade" onClick={() => setPlaying(true)}>
        {/* The visible label and the accessible name are the same text, so
            voice-control users can say exactly what they see. */}
        <span className="video-play" aria-hidden="true">
          ▶
        </span>
        <span>Play video: {entry.title}</span>
      </button>
    )
  }

  if (isVideoFile(entry.embedUrl)) {
    return (
      // A video file plays in the browser's own player; `controls` gives it
      // the standard, keyboard-accessible buttons.
      <video className="video-frame" src={entry.embedUrl} controls autoPlay>
        <a href={entry.embedUrl}>Download the video</a>
      </video>
    )
  }

  return (
    <iframe
      className="video-frame"
      src={playerUrl(entry.embedUrl)}
      // Every iframe needs a title: it's how screen readers name the frame.
      title={`Video: ${entry.title}`}
      allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
      allowFullScreen
      referrerPolicy="strict-origin-when-cross-origin"
    />
  )
}
