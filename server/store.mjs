/**
 * The projects as the admin keeps them, in DATA_DIR (/var/lib/villa-nest on the Pi):
 *
 *   admin/projects.json          every project, drafts too, in order (the admin's copy)
 *   admin/password.json          the password's scrypt hash (admin-password.mjs)
 *   public/data/projects.json    what the site shows: no drafts — Nginx serves /data/ from here
 *   public/projects/<id>/…       the photos — and /projects/
 *
 * The first start copies the projects the site was built with (the repository's public/).
 */
import { existsSync } from 'node:fs'
import { cp, mkdir, readFile, readdir, rename, rm, stat, writeFile } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { COVER_WIDTHS, encodePhoto, hashOf } from '../scripts/lib/project-images.mjs'

const repo = resolve(dirname(fileURLToPath(import.meta.url)), '..')
/** DATA_DIR, else the Pi's (deploy/install-pi.sh), else a folder in the repository (npm run admin here). */
export const DATA_DIR = resolve(
  process.env.DATA_DIR ?? (existsSync('/var/lib/villa-nest') ? '/var/lib/villa-nest' : join(repo, '.admin-data')),
)
export const passwordFile = join(DATA_DIR, 'admin/password.json')
const adminFile = join(DATA_DIR, 'admin/projects.json')
const publicList = join(DATA_DIR, 'public/data/projects.json')
const photosDir = join(DATA_DIR, 'public/projects')

const CATEGORIES = ['construction', 'interior']
const ID = /^[a-z0-9]+(-[a-z0-9]+)*$/
const MAX_PROJECTS = 300
const MAX_PHOTOS = 80
/** Photos uploaded but not (yet) saved in a project are kept this long. */
const UNSAVED_PHOTO_MS = 6 * 3600 * 1000

/** A mistake in what was sent: its message is shown in the admin. */
export class UserError extends Error {}

const fail = (message) => {
  throw new UserError(message)
}

async function writeJson(file, value) {
  await mkdir(dirname(file), { recursive: true })
  const tmp = `${file}.${process.pid}.tmp`
  await writeFile(tmp, `${JSON.stringify(value)}\n`)
  await rename(tmp, file)
}

/** One change at a time (saves and uploads read and write the same files). */
let queue = Promise.resolve()
function serial(task) {
  const run = queue.then(task)
  queue = run.catch(() => undefined)
  return run
}

/** First start: the projects the site was built with. */
export async function seed() {
  if (existsSync(adminFile)) return
  const built = JSON.parse(await readFile(join(repo, 'public/data/projects.json'), 'utf8'))
  if (existsSync(join(repo, 'public/projects'))) await cp(join(repo, 'public/projects'), photosDir, { recursive: true })
  await writeJson(adminFile, { projects: built.projects ?? [] })
  await publish(built.projects ?? [])
}

export async function readProjects() {
  return JSON.parse(await readFile(adminFile, 'utf8')).projects
}

/* ── Checking what the admin sends ────────────────────────────────────── */

const isText = (v, max) => typeof v === 'string' && v.length <= max

/** { vi, en } (en may be empty: the site then shows the Vietnamese). */
function localized(value, field, max, required) {
  if (value == null) {
    if (required) fail(`Thiếu ${field}.`)
    return undefined
  }
  if (typeof value !== 'object' || !isText(value.vi ?? '', max) || !isText(value.en ?? '', max))
    fail(`${field}: chữ quá dài hoặc sai dạng.`)
  const vi = (value.vi ?? '').trim()
  const en = (value.en ?? '').trim()
  if (required && !vi) fail(`Thiếu ${field} (tiếng Việt).`)
  return vi || en ? { vi, en } : undefined
}

function image(value, id, what) {
  if (!value || typeof value !== 'object') fail(`${what}: sai dạng.`)
  const { base, widths, w, h, focus, caption } = value
  if (typeof base !== 'string' || !new RegExp(`^projects/${id}/[a-z0-9]+\\.[0-9a-f]{10}$`).test(base))
    fail(`${what}: ảnh không thuộc dự án này.`)
  if (!Array.isArray(widths) || !widths.length || widths.length > 4 || !widths.every((x) => Number.isInteger(x) && x > 0 && x <= 4096))
    fail(`${what}: sai kích thước.`)
  if (!Number.isInteger(w) || !Number.isInteger(h) || w <= 0 || h <= 0) fail(`${what}: sai kích thước.`)
  const name = base.slice(`projects/${id}/`.length)
  if (!widths.every((x) => existsSync(join(photosDir, id, `${name}-${x}.webp`))))
    fail(`${what}: không tìm thấy ảnh trên máy chủ — tải ảnh lên lại.`)
  const out = { base, widths, w, h }
  if (focus != null) {
    if (!Array.isArray(focus) || focus.length !== 2 || !focus.every((f) => typeof f === 'number' && f >= 0 && f <= 1))
      fail(`${what}: sai điểm canh.`)
    out.focus = focus.map((f) => Math.round(f * 1000) / 1000)
  }
  const text = localized(caption, `${what}: chú thích`, 300)
  if (text) out.caption = text
  return out
}

function project(value, ids) {
  if (!value || typeof value !== 'object') fail('Dự án sai dạng.')
  const { id } = value
  if (typeof id !== 'string' || !ID.test(id) || id.length > 80) fail(`Mã dự án "${id}" không hợp lệ.`)
  if (ids.has(id)) fail(`Mã dự án "${id}" bị trùng.`)
  ids.add(id)
  if (!CATEGORIES.includes(value.category)) fail(`${id}: trang phải là Xây dựng hoặc Nội thất.`)
  const title = localized(value.title, `${id}: tên dự án`, 140, true)
  const photos = value.photos ?? []
  if (!Array.isArray(photos) || photos.length > MAX_PHOTOS) fail(`${id}: tối đa ${MAX_PHOTOS} ảnh.`)
  const out = { id, category: value.category }
  if (value.hidden) out.hidden = true
  if (value.sample) out.sample = true
  out.title = title
  const place = localized(value.place, `${id}: địa điểm`, 140)
  if (place) out.place = place
  if (value.year != null && value.year !== '') {
    if (!isText(String(value.year), 20)) fail(`${id}: năm quá dài.`)
    out.year = String(value.year).trim()
  }
  if (value.area != null && value.area !== '') {
    if (!isText(String(value.area), 40)) fail(`${id}: diện tích quá dài.`)
    out.area = String(value.area).trim()
  }
  const scope = localized(value.scope, `${id}: hạng mục`, 140)
  if (scope) out.scope = scope
  const summary = localized(value.summary, `${id}: giới thiệu`, 3000)
  if (summary) out.summary = summary
  out.cover = value.cover ? image(value.cover, id, `${id}: ảnh bìa`) : null
  out.photos = photos.map((p, i) => image(p, id, `${id}: ảnh ${i + 1}`))
  return out
}

/* ── Saving ───────────────────────────────────────────────────────────── */

/** On the site: the projects not hidden and with a cover; English left empty shows the Vietnamese. */
function forSite(list) {
  const both = (t) => (t ? { vi: t.vi || t.en, en: t.en || t.vi } : undefined)
  return list
    .filter((p) => !p.hidden && p.cover)
    .map(({ hidden: _hidden, ...p }) => ({
      ...p,
      title: both(p.title),
      place: both(p.place),
      scope: both(p.scope),
      summary: both(p.summary),
      cover: p.cover,
      photos: p.photos.map((ph) => (ph.caption ? { ...ph, caption: both(ph.caption) } : ph)),
    }))
}

async function publish(list) {
  await writeJson(publicList, { projects: forSite(list) })
}

/** The photos no project uses any more (a photo just uploaded is given time to be saved). */
async function tidy(list) {
  const used = new Map(list.map((p) => [p.id, new Set([p.cover, ...p.photos].filter(Boolean).map((img) => img.base.split('/').pop()))]))
  if (!existsSync(photosDir)) return
  const now = Date.now()
  for (const dir of await readdir(photosDir)) {
    const names = used.get(dir)
    if (!names) {
      await rm(join(photosDir, dir), { recursive: true, force: true })
      continue
    }
    for (const file of await readdir(join(photosDir, dir))) {
      const name = file.replace(/-\d+\.(avif|webp)$/, '')
      if (names.has(name)) continue
      const { mtimeMs } = await stat(join(photosDir, dir, file))
      if (now - mtimeMs > UNSAVED_PHOTO_MS) await rm(join(photosDir, dir, file), { force: true })
    }
  }
}

/** Checks and saves the whole list (its order is the site's), then puts it on the site. */
export function saveProjects(value) {
  return serial(async () => {
    if (!Array.isArray(value) || value.length > MAX_PROJECTS) fail('Danh sách dự án sai dạng.')
    const ids = new Set()
    const list = value.map((p) => project(p, ids))
    await writeJson(adminFile, { projects: list })
    await publish(list)
    await tidy(list)
    return list
  })
}

/** A photo uploaded to project `id`: encoded at the site's widths (any photo may become the cover). */
export function addPhoto(id, bytes) {
  return serial(async () => {
    if (typeof id !== 'string' || !ID.test(id)) fail('Mã dự án không hợp lệ.')
    if (!(await readProjects()).some((p) => p.id === id)) fail('Không có dự án này — lưu dự án trước.')
    const name = `p${Date.now().toString(36)}${Math.floor(Math.random() * 1296).toString(36)}`
    try {
      const { entry } = await encodePhoto({
        input: bytes,
        sourceHash: hashOf(bytes),
        dir: join(photosDir, id),
        id,
        name,
        sizes: COVER_WIDTHS,
      })
      return entry
    } catch {
      fail('Không đọc được ảnh này. Dùng ảnh JPEG, PNG, WebP hoặc AVIF (ảnh HEIC của iPhone: chọn "Tương thích nhất" khi tải lên).')
    }
  })
}
