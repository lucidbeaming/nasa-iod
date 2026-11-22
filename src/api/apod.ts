/**
 * src/api/apod.ts
 *
 * WHAT: The API client. Fetches Astronomy Pictures of the Day from NASA's
 *       APOD Basic API, checks every response, and converts it into the
 *       app's own `ApodEntry` type.
 * WHERE: The only file that talks to the network. Called by the query
 *        functions in api/queries.ts.
 * CONCEPTS: parsing at the boundary, Zod schemas, discriminated unions,
 *           typed errors, AbortSignal
 * READ MORE:
 *   - https://zod.dev
 *   - https://api.nasa.gov/assets/files/apod/APOD-APIs-and-RSS-info.pdf (the API)
 *   - https://developer.mozilla.org/docs/Web/API/AbortSignal
 *
 * 📘 Concept: parse, don't just type
 * The 2021 version wrote `res.json() as ApodItem[]` and trusted it. When NASA
 * retired that API (#8), it kept returning well-formed JSON full of
 * placeholders, and the app displayed them without complaint. Here, every
 * response goes through a Zod schema first. A schema checks the data at
 * runtime *and* produces the TypeScript type, so the two can't drift apart.
 * Anything that doesn't match fails here, at the boundary, with a message
 * that names the field, instead of as an odd crash deep inside a component.
 *
 * The schemas also *convert*. The API's shape is NASA's business; the
 * component code should get the shape that's convenient for rendering. So
 * the raw `media_type` string becomes a `kind` with exactly the fields each
 * kind needs, and HTML strings become safe RichText (see richText.ts).
 */
import { z } from 'zod'
import { toDateCode, type IsoDate } from '../lib/dates.ts'
import { findEmbedUrl, parseRichText, toPlainText, type RichText } from './richText.ts'

/** NASA's APOD Basic JSON API. Public, CORS-enabled, and needs no API key. */
export const API_BASE = 'https://science.nasa.gov/wp-json/wp/v2/apod-basic'

/** Entries per page. The API caps `per_page` at 25. */
export const PAGE_SIZE = 25

// ─── The app's types ─────────────────────────────────────────────────────────

/** Fields every entry has, whatever its media. */
interface EntryBase {
  /** `YYYY-MM-DD`. Unique per entry, so it's also the entry's id. */
  date: IsoDate
  title: string
  explanation: RichText
  /** Image/video credit and copyright, e.g. "Image Credit & Copyright: Drew Evans". */
  credit: RichText
  /** The entry's page on science.nasa.gov. */
  permalink: string
}

/** A picture. */
export interface ImageEntry extends EntryBase {
  kind: 'image'
  /** Text alternative for the picture, for screen readers and failed loads. */
  alt: string
  /** The full-size image. */
  hdurl: string
  /**
   * The image service URL without size parameters. Append `?w=<pixels>` to
   * get a resized copy (chapter 07 builds a `srcset` from it).
   */
  imageBase: string
  /** Intrinsic size, when the API provides it; lets the browser reserve space. */
  width: number | null
  height: number | null
}

/** A video, played in an embedded player (YouTube, Vimeo, or a video file). */
export interface VideoEntry extends EntryBase {
  kind: 'video'
  embedUrl: string
}

/** Anything else (interactive pages, embeds we couldn't identify). Shown as a link. */
export interface OtherEntry extends EntryBase {
  kind: 'other'
}

/**
 * One Astronomy Picture of the Day.
 *
 * 📘 Concept: discriminated unions
 * `kind` is the *discriminant*: a field whose literal value tells TypeScript
 * which member of the union it's looking at. After `if (entry.kind ===
 * 'video')`, TypeScript knows `entry.embedUrl` exists, and that
 * `entry.hdurl` doesn't. A component can't accidentally render a video as
 * an image, because the type won't let it read the image fields. (The 2021
 * code compared `media_type === "image"` against a plain string and simply
 * dropped everything else: #11.)
 */
export type ApodEntry = ImageEntry | VideoEntry | OtherEntry

/** One page of the archive, newest first. */
export interface ApodPage {
  entries: ApodEntry[]
  /** 1-based page number. */
  page: number
  /** Total pages at this page size, from the `X-WP-TotalPages` header. */
  totalPages: number
}

// ─── Errors ──────────────────────────────────────────────────────────────────

/**
 * A failed API request. Thrown for HTTP errors and for responses that don't
 * match the schema, so callers can tell "the API said no" (and why) from a
 * bug in our own code.
 */
export class ApiError extends Error {
  /** HTTP status, or 0 when the request never got a response (offline, CORS). */
  readonly status: number
  /** The API's machine-readable error code, e.g. `apod_basic_not_found`. */
  readonly code: string | null

  constructor(message: string, status: number, code: string | null = null) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
  }

  /** True for 4xx responses: retrying the same request won't help. */
  get isClientError(): boolean {
    return this.status >= 400 && this.status < 500
  }
}

// ─── Schemas ─────────────────────────────────────────────────────────────────

// The legacy alt text on many pre-2025 entries is boilerplate, not a
// description, so it's treated as missing.
const BOILERPLATE_ALT = /^See Explanation\b/i

/** Reads `w` and `h` from an image-service URL such as `…jpg?w=3709&h=2772&fit=clip`. */
function imageInfo(hdurl: string) {
  const url = new URL(hdurl)
  const width = Number(url.searchParams.get('w')) || null
  const height = Number(url.searchParams.get('h')) || null
  return { imageBase: url.origin + url.pathname, width, height }
}

/** What the API sends for one entry (only the fields this app uses). */
const RawEntry = z.object({
  date: z.iso.date(),
  title: z.string().min(1),
  media_type: z.string(),
  explanation: z.string(),
  alt: z.string().default(''),
  credit: z.string().default(''),
  hdurl: z.string().default(''),
  permalink: z.url(),
  basic_html: z.string().default(''),
})

/** Converts a raw entry into an {@link ApodEntry}. */
const Entry = RawEntry.transform((raw): ApodEntry => {
  const base: EntryBase = {
    date: raw.date,
    title: raw.title,
    // Every explanation starts with a bold "Explanation:" label; the UI has
    // its own heading, so the label is removed.
    explanation: parseRichText(raw.explanation.replace(/^\s*<strong>Explanation:<\/strong>/, '')),
    credit: parseRichText(raw.credit),
    permalink: raw.permalink,
  }

  if (raw.media_type === 'image' && raw.hdurl) {
    const alt = raw.alt.trim()
    return {
      ...base,
      kind: 'image',
      alt: alt && !BOILERPLATE_ALT.test(alt) ? alt : raw.title,
      hdurl: raw.hdurl,
      ...imageInfo(raw.hdurl),
    }
  }

  // For video and iframe entries, the player URL is only in basic_html.
  const embedUrl = findEmbedUrl(raw.basic_html)
  if ((raw.media_type === 'video' || raw.media_type === 'iframe') && embedUrl) {
    return { ...base, kind: 'video', embedUrl }
  }
  return { ...base, kind: 'other' }
})

/** The error body WordPress sends with 4xx/5xx responses. */
const ErrorBody = z.object({ code: z.string(), message: z.string() })

// ─── Requests ────────────────────────────────────────────────────────────────

/** Fetches `url` and returns the response, or throws an {@link ApiError}. */
async function request(url: string, signal?: AbortSignal): Promise<Response> {
  let res: Response
  try {
    // Passing the AbortSignal lets the caller cancel the request: TanStack
    // Query does this when a component unmounts or the query is no longer
    // needed, so abandoned requests don't keep downloading.
    res = await fetch(url, { signal })
  } catch (error) {
    // An abort is not a failure; let it propagate unchanged.
    if (error instanceof DOMException && error.name === 'AbortError') throw error
    throw new ApiError('Could not reach NASA’s APOD service. Check your connection.', 0)
  }

  // ⚠️ Common mistake (from v0-2021, src/Main.js):
  //   fetch(nasaQuery).then(res => res.json())
  // fetch only rejects when there's no response at all. A 404 or 500 is a
  // *successful* fetch, so without this check an error page gets parsed as
  // if it were data.
  if (!res.ok) {
    const body = ErrorBody.safeParse(await res.json().catch(() => null))
    throw new ApiError(
      body.success ? body.data.message : `NASA’s APOD service returned HTTP ${res.status}.`,
      res.status,
      body.success ? body.data.code : null,
    )
  }
  return res
}

/**
 * Parses an array of entries, skipping (and logging) any that don't match.
 * One malformed day shouldn't hide the other 24 on its page.
 */
function parseEntries(data: unknown): ApodEntry[] {
  const list = z.array(z.unknown()).safeParse(data)
  if (!list.success) throw new ApiError('Unexpected response from NASA’s APOD service.', 200)
  const entries: ApodEntry[] = []
  for (const item of list.data) {
    const parsed = Entry.safeParse(item)
    if (parsed.success) entries.push(parsed.data)
    else
      console.warn(
        'Skipping an APOD entry that did not match the schema:',
        z.prettifyError(parsed.error),
      )
  }
  return entries
}

/**
 * Fetches one page of the archive, newest first.
 *
 * Pages past the end return no entries, not an error.
 *
 * @param page - 1-based page number
 * @param signal - cancels the request when aborted
 */
export async function fetchApodPage(page: number, signal?: AbortSignal): Promise<ApodPage> {
  const res = await request(`${API_BASE}?page=${page}&per_page=${PAGE_SIZE}`, signal)
  return {
    entries: parseEntries(await res.json()),
    page,
    totalPages: Number(res.headers.get('X-WP-TotalPages')) || page,
  }
}

/**
 * Fetches the entry for one day.
 *
 * @param date - `YYYY-MM-DD`
 * @throws {ApiError} with code `apod_basic_not_found` (status 404) if there's
 *         no entry for that day
 */
export async function fetchApodDay(date: IsoDate, signal?: AbortSignal): Promise<ApodEntry> {
  const res = await request(`${API_BASE}/${toDateCode(date)}`, signal)
  const parsed = Entry.safeParse(await res.json())
  if (!parsed.success) {
    throw new ApiError(`The entry for ${date} has an unexpected format.`, 200)
  }
  return parsed.data
}

/** Plain-text explanation, for places that can't show formatting. */
export function plainExplanation(entry: ApodEntry): string {
  return toPlainText(entry.explanation)
}
