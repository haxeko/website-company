#!/usr/bin/env node
/**
 * VILLA NEST image pipeline
 * ─────────────────────────
 * Turns the high-resolution photos in `assets-src/` into the optimised files the
 * hero carousel loads from `public/assets/slides/`:
 *
 *   <slug>-<w>.avif / .webp            landscape variants (desktop, tablets in landscape)
 *   <slug>-portrait-<w>.avif / .webp   4:5 crops (phones / portrait screens)
 *   <slug>-ambient.webp                tiny, heavily blurred colour wash used as scene light
 *
 * Every photo gets the same subtle "cinematic" grade (tone curve, warmth, calmer greens)
 * so the three spaces read as one consistent, premium set on the dark background.
 *
 * Settings live in src/data/media.json (shared with the app).
 *
 *   npm run images                 # all slides
 *   npm run images -- interior     # only the given slug(s)
 */
import { mkdir, readFile, readdir, rm } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const media = JSON.parse(await readFile(join(root, 'src/data/media.json'), 'utf8'))

const sourceDir = join(root, media.sourceDir)
const outputDir = join(root, media.outputDir)
const only = process.argv.slice(2)
const slugs = Object.keys(media.images).filter((slug) => !only.length || only.includes(slug))

/* ── Colour grading ───────────────────────────────────────────────────────── */

const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v)
const smoothstep = (a, b, x) => {
  const t = clamp01((x - a) / (b - a))
  return t * t * (3 - 2 * t)
}
const toLinear = (c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4)
const toSrgb = (c) => (c <= 0.0031308 ? c * 12.92 : 1.055 * c ** (1 / 2.4) - 0.055)

/**
 * Applies the grade to a raw RGB buffer in place.
 * exposure   – linear-light gain (1 = unchanged)
 * contrast   – blend amount towards a smoothstep S-curve (0 = unchanged)
 * saturation – global saturation (1 = unchanged)
 * greens     – extra saturation factor for green-dominant pixels (lawns, foliage)
 * warmth     – shifts highlights towards amber and lifts shadows slightly cooler
 */
function grade(data, grade) {
  const { exposure = 1, contrast = 0, saturation = 1, greens = 1, warmth = 0 } = grade

  // Per-channel tone LUT: exposure in linear light, then the S-curve.
  const lut = new Float32Array(256)
  for (let i = 0; i < 256; i++) {
    const exposed = toSrgb(clamp01(toLinear(i / 255) * exposure))
    const curved = exposed * exposed * (3 - 2 * exposed)
    lut[i] = exposed + (curved - exposed) * contrast
  }

  for (let i = 0; i < data.length; i += 3) {
    let r = lut[data[i]]
    let g = lut[data[i + 1]]
    let b = lut[data[i + 2]]

    const y = 0.2126 * r + 0.7152 * g + 0.0722 * b
    const greenness = clamp01((g - Math.max(r, b)) * 5)
    const sat = saturation * (1 - (1 - greens) * greenness)
    r = y + (r - y) * sat
    g = y + (g - y) * sat
    b = y + (b - y) * sat

    // Split toning: warm highlights, very slightly cool shadows.
    const hi = smoothstep(0.35, 1, y) * warmth
    const lo = (1 - smoothstep(0, 0.4, y)) * warmth * 0.35
    r += hi * 1.0 - lo * 0.4
    g += hi * 0.45
    b += -hi * 0.9 + lo * 0.6

    data[i] = Math.round(clamp01(r) * 255)
    data[i + 1] = Math.round(clamp01(g) * 255)
    data[i + 2] = Math.round(clamp01(b) * 255)
  }
}

/* ── Encoding helpers ─────────────────────────────────────────────────────── */

const encoders = {
  avif: (img) => img.avif({ quality: media.quality.avif, effort: 5, chromaSubsampling: '4:2:0' }),
  webp: (img) => img.webp({ quality: media.quality.webp, effort: 6, smartSubsample: true }),
}

async function writeVariants(base, crop, name, widths) {
  const results = []
  for (const w of widths) {
    const targetW = Math.min(w, crop ? crop.width : base.info.width)
    for (const [format, encode] of Object.entries(encoders)) {
      let img = sharp(base.data, { raw: base.info })
      if (crop) img = img.extract(crop)
      img = img.resize({ width: targetW, kernel: 'lanczos3' })
      const file = join(outputDir, `${name}-${w}.${format}`)
      const info = await encode(img).toFile(file)
      results.push(`${name}-${w}.${format} ${info.width}×${info.height} ${(info.size / 1024).toFixed(0)} KB`)
    }
  }
  return results
}

/* ── Main ─────────────────────────────────────────────────────────────────── */

await mkdir(outputDir, { recursive: true })
for (const file of await readdir(outputDir)) {
  const slug = slugs.find((s) => file.startsWith(`${s}-`))
  if (slug && /\.(avif|webp)$/.test(file)) await rm(join(outputDir, file))
}

for (const slug of slugs) {
  const cfg = media.images[slug]
  const { data, info } = await sharp(join(sourceDir, cfg.source))
    .rotate()
    .toColourspace('srgb')
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true })

  grade(data, cfg.grade ?? {})
  const base = { data, info: { width: info.width, height: info.height, channels: 3 } }

  const lines = await writeVariants(base, null, slug, media.landscapeWidths)

  // Portrait (4:5) crop, positioned horizontally by `portraitFocusX`.
  const cropW = Math.min(info.width, Math.round(info.height * media.portraitAspect))
  const crop = {
    left: Math.round((info.width - cropW) * (cfg.portraitFocusX ?? 0.5)),
    top: 0,
    width: cropW,
    height: info.height,
  }
  lines.push(...(await writeVariants(base, crop, `${slug}-portrait`, media.portraitWidths)))

  // Ambient wash: downscale hard, then blur → smooth colour field with no detail.
  const ambient = await sharp(
    await sharp(data, { raw: base.info })
      .resize(48, 30, { fit: 'cover' })
      .blur(2.2)
      .png()
      .toBuffer(),
  )
    .resize(320, 200, { kernel: 'cubic' })
    .blur(12)
    .modulate({ saturation: 1.15 })
    .webp({ quality: media.quality.ambient })
    .toFile(join(outputDir, `${slug}-ambient.webp`))
  lines.push(`${slug}-ambient.webp ${ambient.width}×${ambient.height} ${(ambient.size / 1024).toFixed(1)} KB`)

  console.log(`\n${slug}`)
  for (const line of lines) console.log(`  ${line}`)
}
