#!/usr/bin/env node
/**
 * VILLA NEST projects
 * ───────────────────
 * Turns content/projects/projects.json and its photos into what the Construction and Interior
 * pages load:
 *
 *   public/projects/<id>/<photo>.<key>-<w>.avif / .webp   each photo at a few widths
 *   public/data/projects.json                              the list, with each photo's size
 *
 * <key> is a hash of the photo (its file, crop and encoding), so a photo that changes gets a new
 * address and no cache can show an old one; only photos whose key changed are encoded again,
 * and the files of photos or projects that are gone are removed.
 *
 *   npm run projects
 */
import { createHash } from 'node:crypto'
import { existsSync } from 'node:fs'
import { mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const contentDir = join(root, 'content/projects')
const outDir = join(root, 'public/projects')
const dataFile = join(root, 'public/data/projects.json')

/** Widths of the cover (also the project page's banner) and of the other photos — never wider than the photo. */
const COVER_WIDTHS = [640, 1280, 1920]
const PHOTO_WIDTHS = [640, 1280]
const CATEGORIES = ['construction', 'interior']
const LANGS = ['vi', 'en']
const encoders = {
  avif: (img) => img.avif({ quality: 60, effort: 4 }),
  webp: (img) => img.webp({ quality: 80, effort: 5 }),
}
/** Part of every key: encoding differently makes new files. */
const RECIPE = JSON.stringify({ avif: [60, 4], webp: [80, 5], sharpen: 0.5 })

const fail = (message) => {
  console.error(`✗ ${message}`)
  process.exit(1)
}

const doc = JSON.parse(await readFile(join(contentDir, 'projects.json'), 'utf8'))
const projects = Array.isArray(doc.projects) ? doc.projects : fail('content/projects/projects.json: "projects" must be a list')

/** A text in both languages ({ vi, en }); a plain string serves for both. */
function text(id, field, value, required) {
  if (value == null || value === '') {
    if (required) fail(`${id}: "${field}" is missing`)
    return undefined
  }
  if (typeof value === 'string') return { vi: value, en: value }
  for (const lang of LANGS) if (typeof value[lang] !== 'string') fail(`${id}: "${field}.${lang}" is missing`)
  return { vi: value.vi, en: value.en }
}

const sourceHashes = new Map()
async function sourceHash(file) {
  if (!sourceHashes.has(file))
    sourceHashes.set(
      file,
      createHash('sha256')
        .update(await readFile(file))
        .digest('hex'),
    )
  return sourceHashes.get(file)
}

/** Encodes one photo (when its key is new) and returns its entry in the list. */
async function photo(project, spec, name, sizes) {
  const entry = typeof spec === 'string' ? { src: spec } : spec
  if (!entry?.src) fail(`${project.id}: a photo has no "src"`)
  // A bare file name lives in the project's folder; a path is from the repository root.
  const file = entry.src.includes('/') ? join(root, entry.src) : join(contentDir, project.id, entry.src)
  if (!existsSync(file)) fail(`${project.id}: ${entry.src} not found`)
  // (as the photo stands: a phone's portrait photo is stored on its side, with an orientation tag)
  const meta = await sharp(file).metadata()
  const [W, H] = (meta.orientation ?? 1) >= 5 ? [meta.height, meta.width] : [meta.width, meta.height]
  const crop = entry.crop ?? [0, 0, W, H]
  const [cx, cy, cw, ch] = crop
  if (crop.length !== 4 || cx < 0 || cy < 0 || cw <= 0 || ch <= 0 || cx + cw > W || cy + ch > H) {
    fail(`${project.id}: crop ${JSON.stringify(crop)} is outside ${entry.src} (${W} × ${H})`)
  }
  const key = createHash('sha256')
    .update(`${await sourceHash(file)}|${crop}|${RECIPE}`)
    .digest('hex')
    .slice(0, 10)
  const base = `${name}.${key}`
  const top = Math.min(cw, sizes.at(-1))
  const widths = [...sizes.filter((w) => w < top), top]
  const dir = join(outDir, project.id)
  const wanted = widths.flatMap((w) => Object.keys(encoders).map((ext) => `${base}-${w}.${ext}`))
  if (!wanted.every((f) => existsSync(join(dir, f)))) {
    await mkdir(dir, { recursive: true })
    const cropped = await sharp(file).rotate().extract({ left: cx, top: cy, width: cw, height: ch }).toColourspace('srgb').toBuffer()
    for (const w of widths) {
      const resized = sharp(cropped).resize({ width: w, kernel: 'lanczos3' }).sharpen({ sigma: 0.5 })
      for (const [ext, encode] of Object.entries(encoders)) await encode(resized.clone()).toFile(join(dir, `${base}-${w}.${ext}`))
    }
    console.log(`  ${project.id}/${base}  ${widths.join(', ')}`)
  }
  const out = { base: `projects/${project.id}/${base}`, widths, w: cw, h: ch }
  if (entry.focus) out.focus = entry.focus
  if (entry.caption) out.caption = text(project.id, 'caption', entry.caption)
  return { out, files: wanted }
}

const list = []
const keep = new Map()
const ids = new Set()
for (const project of projects) {
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(project.id ?? '')) fail(`"${project.id}": an id is lower case letters, digits and dashes`)
  if (ids.has(project.id)) fail(`${project.id}: the id is used twice`)
  ids.add(project.id)
  if (!CATEGORIES.includes(project.category)) fail(`${project.id}: category is "construction" or "interior"`)
  if (!project.cover) fail(`${project.id}: "cover" is missing`)
  const files = []
  const cover = await photo(project, project.cover, 'cover', COVER_WIDTHS)
  files.push(...cover.files)
  const photos = []
  for (const [i, spec] of (project.photos ?? []).entries()) {
    const p = await photo(project, spec, String(i + 1).padStart(2, '0'), PHOTO_WIDTHS)
    files.push(...p.files)
    photos.push(p.out)
  }
  keep.set(project.id, new Set(files))
  list.push({
    id: project.id,
    category: project.category,
    ...(project.sample ? { sample: true } : {}),
    title: text(project.id, 'title', project.title, true),
    place: text(project.id, 'place', project.place),
    year: project.year ? String(project.year) : undefined,
    area: project.area || undefined,
    scope: text(project.id, 'scope', project.scope),
    summary: text(project.id, 'summary', project.summary),
    cover: cover.out,
    photos,
  })
}

// The files of photos and projects that are gone.
await mkdir(outDir, { recursive: true })
for (const dir of await readdir(outDir)) {
  const files = keep.get(dir)
  if (!files) {
    await rm(join(outDir, dir), { recursive: true, force: true })
    continue
  }
  for (const file of await readdir(join(outDir, dir))) if (!files.has(file)) await rm(join(outDir, dir, file))
}

await mkdir(dirname(dataFile), { recursive: true })
await writeFile(dataFile, `${JSON.stringify({ projects: list })}\n`)
const count = (category) => list.filter((p) => p.category === category).length
console.log(`✓ ${list.length} projects (${count('construction')} construction, ${count('interior')} interior) → public/data/projects.json`)
