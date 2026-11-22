/**
 * src/types.ts
 *
 * WHAT: The shape of one Astronomy Picture of the Day entry, as the original
 *       2021 app expected it from api.nasa.gov/planetary/apod.
 * WHERE: Imported by Main.tsx (fetching), ImageBlock.tsx and Image.tsx (rendering).
 * CONCEPTS: TypeScript interfaces, compile-time vs runtime types
 * READ MORE: https://www.typescriptlang.org/docs/handbook/2/objects.html
 *
 * 📘 Concept: types describe, they don't check
 * An interface only exists while TypeScript compiles; it's erased from the
 * JavaScript that runs. Writing `const data: ApodItem[] = await res.json()`
 * doesn't verify anything: if the API sends something else, the program
 * believes the type anyway and fails later, somewhere far from the cause.
 * That is exactly what happened when NASA retired this API (#8): the code
 * kept "working" and showed placeholder images. Chapter 03 replaces this
 * file with Zod schemas, which check the data when it arrives.
 */

/** One APOD entry from the legacy api.nasa.gov endpoint. */
export interface ApodItem {
  /** Publication date, `YYYY-MM-DD`. */
  date: string
  title: string
  explanation: string
  /** `"image"` or `"video"`. The 2021 app only rendered images (#11). */
  media_type: string
  /** The image (or video embed) URL. */
  url: string
  /** Full-resolution image URL, when there is one. */
  hdurl?: string
  copyright?: string
}
