/**
 * The projects' photos as the site loads them — each at a few widths, AVIF and WebP, named
 * <name>.<key>-<width>.<ext>. The key is a hash of the photo (its file, crop and this recipe), so
 * a photo that changes gets a new address and no cache can show an old one. Shared by
 * `npm run projects` (scripts/build-projects.mjs) and the admin (server/admin-server.mjs).
 */
import { createHash } from 'node:crypto'
import { existsSync } from 'node:fs'
import { mkdir } from 'node:fs/promises'
import { join } from 'node:path'
import sharp from 'sharp'

/** Widths of a cover (also the project page's banner) and of the other photos. */
export const COVER_WIDTHS = [640, 1280, 1920]
export const PHOTO_WIDTHS = [640, 1280]
const encoders = {
  avif: (img) => img.avif({ quality: 60, effort: 4 }),
  webp: (img) => img.webp({ quality: 80, effort: 5 }),
}
/** Part of every key: encoding differently makes new files. */
const RECIPE = JSON.stringify({ avif: [60, 4], webp: [80, 5], sharpen: 0.5 })

export const hashOf = (bytes) => createHash('sha256').update(bytes).digest('hex')

/** A photo's size as it stands (a phone's portrait photo is stored on its side, with an orientation tag). */
export async function photoSize(input) {
  const meta = await sharp(input).metadata()
  return (meta.orientation ?? 1) >= 5 ? [meta.height, meta.width] : [meta.width, meta.height]
}

/**
 * Encodes one photo into `dir` (unless its files are there already) and returns its entry in the
 * list — `{ base: 'projects/<id>/<name>.<key>', widths, w, h }` — and the files it is made of.
 * `input` is a file path or the photo's bytes, `sourceHash` the hash of those bytes; `crop` is
 * [x, y, width, height] on the photo as it stands (the whole photo when left out).
 */
export async function encodePhoto({ input, sourceHash, crop, dir, id, name, sizes }) {
  const [W, H] = await photoSize(input)
  const box = crop ?? [0, 0, W, H]
  const [cx, cy, cw, ch] = box
  if (box.length !== 4 || cx < 0 || cy < 0 || cw <= 0 || ch <= 0 || cx + cw > W || cy + ch > H) {
    throw new Error(`crop ${JSON.stringify(box)} is outside the photo (${W} × ${H})`)
  }
  const key = createHash('sha256').update(`${sourceHash}|${box}|${RECIPE}`).digest('hex').slice(0, 10)
  const base = `${name}.${key}`
  const top = Math.min(cw, sizes.at(-1))
  const widths = [...sizes.filter((w) => w < top), top]
  const files = widths.flatMap((w) => Object.keys(encoders).map((ext) => `${base}-${w}.${ext}`))
  const encoded = !files.every((f) => existsSync(join(dir, f)))
  if (encoded) {
    await mkdir(dir, { recursive: true })
    const cropped = await sharp(input).rotate().extract({ left: cx, top: cy, width: cw, height: ch }).toColourspace('srgb').toBuffer()
    for (const w of widths) {
      const resized = sharp(cropped).resize({ width: w, kernel: 'lanczos3' }).sharpen({ sigma: 0.5 })
      for (const [ext, encode] of Object.entries(encoders)) await encode(resized.clone()).toFile(join(dir, `${base}-${w}.${ext}`))
    }
  }
  return { entry: { base: `projects/${id}/${base}`, widths, w: cw, h: ch }, files, encoded }
}
