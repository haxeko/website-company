#!/usr/bin/env node
/**
 * VILLA NEST image pipeline
 * ─────────────────────────
 * Turns the high-resolution photos in `assets-src/` into the panorama panels the hero
 * carousel loads from `public/assets/slides/`:
 *
 *   <slug>-<w>.avif / .webp            landscape panels (desktop, tablets in landscape)
 *   <slug>-portrait-<w>.avif / .webp   portrait panels (phones / portrait screens)
 *   <slug>-ambient.webp                tiny, heavily blurred colour wash used as scene light
 *
 * and the photos of the stand-alone pages (media.json → pages) into `public/assets/pages/`:
 *
 *   <page>-<w>.avif / .webp            the landscape view
 *   <page>-portrait-<w>.avif / .webp   the crop for phones
 *   <extra>-<w>.avif / .webp           a page's other images (camera feeds, drawings, light variants)
 *
 * The three photos are treated as ONE panorama (in the ring order of media.json):
 *   1. every photo gets the same subtle "cinematic" grade,
 *   2. each is cropped to exactly aspect × (1 + seam), so the strips that overlap a
 *      neighbour line up with the neighbour's strip on screen,
 *   3. the colour and light of every pair of touching edges are pulled together
 *      ("harmonize"), so the cross-fade between neighbours reads as one continuous image,
 *   4. variants are resized with Lanczos, lightly sharpened and encoded at high quality.
 *
 * Settings live in src/data/media.json (shared with the app).
 *
 *   npm run images
 *   npm run images -- --pages     (the stand-alone pages' photos only)
 */
import { mkdir, readFile, readdir, rm } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const media = JSON.parse(await readFile(join(root, 'src/data/media.json'), 'utf8'))

const sourceDir = join(root, media.sourceDir)
const outputDir = join(root, media.outputDir)
const { seam } = media.geometry
/** Fraction of a cropped panel's width shared with each neighbour. */
const overlap = seam / (1 + seam)

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

/* ── Panorama: crop + seam harmonisation ─────────────────────────────────── */

function coverCrop(width, height, aspect, fx, fy, zoom = 1) {
  // The largest crop of that aspect, `zoom` times closer, placed by the focus (as object-position).
  const fullWidth = width / height > aspect ? height * aspect : width
  const w = Math.round(fullWidth / zoom)
  const h = Math.round(Math.round(fullWidth / aspect) / zoom)
  return { left: Math.round((width - w) * fx), top: Math.round((height - h) * fy), width: w, height: h }
}

/**
 * Crop of one panel cut from a continuous strip image: neighbouring slots are exactly one
 * pitch apart, so the strips they share are the same pixels and that seam is invisible.
 */
function stripCrop(info, strip, slot, aspect) {
  let pitch = strip.pitch ? strip.pitch * info.width : info.height * aspect
  let height = pitch / aspect
  if (height > info.height) {
    height = info.height
    pitch = height * aspect
  }
  const width = Math.round(pitch * (1 + seam))
  const left = Math.round(strip.centerX * info.width + slot * pitch - width / 2)
  const top = Math.round((info.height - height) * (strip.focusY ?? 0.5))
  if (left < 0 || left + width > info.width) {
    throw new Error(`strip slot ${slot} (${left}…${left + width}px) falls outside the ${info.width}px source`)
  }
  return { left, top, width, height: Math.round(height) }
}

/** Per-row average colour of the columns [x0, x1), smoothed vertically. */
function edgeProfile(img, W, H, x0, x1) {
  const rows = new Float32Array(H * 3)
  for (let y = 0; y < H; y++) {
    let r = 0
    let g = 0
    let b = 0
    for (let x = x0; x < x1; x++) {
      const i = (y * W + x) * 3
      r += img[i]
      g += img[i + 1]
      b += img[i + 2]
    }
    const n = x1 - x0
    rows[y * 3] = r / n
    rows[y * 3 + 1] = g / n
    rows[y * 3 + 2] = b / n
  }
  // Gaussian blur along y so only the large-scale light and colour are matched.
  const sigma = Math.max(2, H * 0.05)
  const radius = Math.ceil(sigma * 3)
  const kernel = Array.from({ length: radius * 2 + 1 }, (_, k) => Math.exp(-((k - radius) ** 2) / (2 * sigma * sigma)))
  const out = new Float32Array(H * 3)
  for (let y = 0; y < H; y++) {
    for (let c = 0; c < 3; c++) {
      let sum = 0
      let weight = 0
      for (let k = -radius; k <= radius; k++) {
        const yy = Math.min(H - 1, Math.max(0, y + k))
        sum += rows[yy * 3 + c] * kernel[k + radius]
        weight += kernel[k + radius]
      }
      out[y * 3 + c] = sum / weight
    }
  }
  return out
}

/** Pulls the colours of every pair of touching edges (in ring order) towards each other. */
function harmonize(panels, W, H) {
  const { strength, reach: reachSeams } = media.harmonize
  const ov = Math.max(1, Math.round(W * overlap))
  const reach = Math.min(Math.round(W / 2), Math.round(ov * reachSeams))
  const n = panels.length
  const left = panels.map(() => null)
  const right = panels.map(() => null)

  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n
    const a = edgeProfile(panels[i], W, H, W - ov, W)
    const b = edgeProfile(panels[j], W, H, 0, ov)
    const da = new Float32Array(H * 3)
    const db = new Float32Array(H * 3)
    for (let k = 0; k < H * 3; k++) {
      const target = (a[k] + b[k]) / 2
      da[k] = (target - a[k]) * strength
      db[k] = (target - b[k]) * strength
    }
    right[i] = da
    left[j] = db
  }

  panels.forEach((img, p) => {
    for (let x = 0; x < reach; x++) {
      const w = 1 - smoothstep(ov, reach, x)
      const xr = W - 1 - x
      for (let y = 0; y < H; y++) {
        const il = (y * W + x) * 3
        const ir = (y * W + xr) * 3
        for (let c = 0; c < 3; c++) {
          img[il + c] += left[p][y * 3 + c] * w
          img[ir + c] += right[p][y * 3 + c] * w
        }
      }
    }
  })
}

/* ── Encoding helpers ─────────────────────────────────────────────────────── */

const encoders = {
  avif: (img) => img.avif({ quality: media.quality.avif, effort: 5, chromaSubsampling: '4:4:4' }),
  webp: (img) => img.webp({ quality: media.quality.webp, effort: 6, smartSubsample: true }),
}

function toUint8(img) {
  const out = Buffer.alloc(img.length)
  for (let i = 0; i < img.length; i++) out[i] = Math.round(clamp01(img[i]) * 255)
  return out
}

async function writeVariants(img, W, H, name, widths) {
  const lines = []
  const raw = { raw: { width: W, height: H, channels: 3 } }
  for (const w of widths) {
    for (const [format, encode] of Object.entries(encoders)) {
      let pipeline = sharp(img, raw)
      if (w < W) pipeline = pipeline.resize({ width: w, kernel: 'lanczos3' }).sharpen({ sigma: 0.55, m1: 0.6, m2: 1.2 })
      const info = await encode(pipeline).toFile(join(outputDir, `${name}-${w}.${format}`))
      lines.push(`${name}-${w}.${format} ${info.width}×${info.height} ${(info.size / 1024).toFixed(0)} KB`)
    }
  }
  return lines
}

async function writePreview(panels, W, H, file) {
  const ov = Math.round(W * overlap)
  const step = W - ov
  const total = step * panels.length + ov
  const out = new Float32Array(total * H * 3)
  panels.forEach((img, p) => {
    const x0 = p * step
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        const a = p > 0 && x < ov ? smoothstep(0, 1, x / ov) : 1
        const o = (y * total + x0 + x) * 3
        const i = (y * W + x) * 3
        for (let c = 0; c < 3; c++) out[o + c] = out[o + c] * (1 - a) + img[i + c] * a
      }
    }
  })
  await sharp(toUint8(out), { raw: { width: total, height: H, channels: 3 } })
    .resize({ width: 2400 })
    .jpeg({ quality: 85 })
    .toFile(file)
  console.log('preview →', file)
}

/* ── Main ─────────────────────────────────────────────────────────────────── */

/** `npm run images -- --pages`: the stand-alone pages' photos only (the panorama takes minutes). */
const panorama = !process.argv.includes('--pages')

await mkdir(outputDir, { recursive: true })
for (const file of panorama ? await readdir(outputDir) : []) {
  if (/\.(avif|webp)$/.test(file)) await rm(join(outputDir, file))
}

// 1. Grade every source once.
const graded = {}
for (const slug of panorama ? media.order : []) {
  const cfg = media.images[slug]
  const source = cfg.strip ? media.strips[cfg.strip].source : cfg.source
  const { data, info } = await sharp(join(sourceDir, source))
    .rotate()
    .toColourspace('srgb')
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true })
  grade(data, cfg.grade ?? {})
  graded[slug] = { data, info: { width: info.width, height: info.height, channels: 3 } }
}

// 2. Build both panoramas (landscape + portrait) and encode them.
const layouts = [
  {
    name: 'landscape',
    suffix: '',
    aspect: media.geometry.landscapeAspect,
    widths: media.landscapeWidths,
    focus: (c) => c.focus,
    zoom: (c) => c.zoom ?? 1,
  },
  {
    name: 'portrait',
    suffix: '-portrait',
    aspect: media.geometry.portraitAspect,
    widths: media.portraitWidths,
    focus: (c) => [c.portraitFocusX ?? 0.5, 0.5],
    zoom: () => 1,
  },
]

const report = {}
for (const layout of panorama ? layouts : []) {
  const cropAspect = layout.aspect * (1 + seam)
  const W = Math.max(...layout.widths)
  const H = Math.round(W / cropAspect)
  const panels = []
  for (const slug of media.order) {
    const { data, info } = graded[slug]
    const cfg = media.images[slug]
    const crop = cfg.strip
      ? stripCrop(info, media.strips[cfg.strip][layout.name], cfg.slot, layout.aspect)
      : coverCrop(info.width, info.height, cropAspect, ...layout.focus(cfg), layout.zoom(cfg))
    if (crop.width < W) console.warn(`! ${slug}: source crop is only ${crop.width}px wide (< ${W}px) — upscaled`)
    const buf = await sharp(data, { raw: info }).extract(crop).resize(W, H, { kernel: 'lanczos3' }).raw().toBuffer()
    panels.push(Float32Array.from(buf, (v) => v / 255))
  }
  harmonize(panels, W, H)

  if (process.env.PANORAMA_PREVIEW && !layout.suffix) {
    // Debug: the three panels laid side by side with their cross-fades, as on screen.
    await writePreview(panels, W, H, process.env.PANORAMA_PREVIEW)
    process.exit(0)
  }
  for (const [p, slug] of media.order.entries()) {
    const img = toUint8(panels[p])
    ;(report[slug] ??= []).push(...(await writeVariants(img, W, H, `${slug}${layout.suffix}`, layout.widths)))

    if (!layout.suffix) {
      // Ambient wash: downscale hard, then blur → smooth colour field with no detail.
      const ambient = await sharp(
        await sharp(img, { raw: { width: W, height: H, channels: 3 } })
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
      report[slug].push(`${slug}-ambient.webp ${ambient.width}×${ambient.height} ${(ambient.size / 1024).toFixed(1)} KB`)
    }
  }
}

/* ── Stand-alone pages: no grade, no seams, just resized and encoded ───────── */

const pages = media.pages ?? {}
const pagesDir = join(root, pages.outputDir ?? 'public/assets/pages')
await mkdir(pagesDir, { recursive: true })
for (const file of await readdir(pagesDir)) {
  if (/\.(avif|webp)$/.test(file)) await rm(join(pagesDir, file))
}

for (const [slug, page] of Object.entries(pages)) {
  if (typeof page !== 'object' || !page.source) continue
  const source = join(sourceDir, page.source)
  const views = [[slug, source, page.crop ?? null, page.landscapeWidths]]
  if (page.portrait) views.push([`${slug}-portrait`, source, page.portrait.crop, page.portrait.widths])
  for (const extra of page.extras ?? []) views.push([extra.name, join(sourceDir, extra.source), extra.crop ?? null, extra.widths])
  report[slug] = []
  for (const [name, file, crop, widths] of views) {
    for (const w of widths) {
      for (const [format, encode] of Object.entries(encoders)) {
        let pipeline = sharp(file)
        if (crop) pipeline = pipeline.extract({ left: crop[0], top: crop[1], width: crop[2], height: crop[3] })
        pipeline = pipeline.resize({ width: w, kernel: 'lanczos3', withoutEnlargement: true }).sharpen({ sigma: 0.5, m1: 0.5, m2: 1 })
        const info = await encode(pipeline).toFile(join(pagesDir, `${name}-${w}.${format}`))
        report[slug].push(`${name}-${w}.${format} ${info.width}×${info.height} ${(info.size / 1024).toFixed(0)} KB`)
      }
    }
  }
}

for (const [slug, lines] of Object.entries(report)) {
  console.log(`\n${slug}`)
  for (const line of lines) console.log(`  ${line}`)
}
