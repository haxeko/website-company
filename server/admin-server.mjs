#!/usr/bin/env node
/**
 * VILLA NEST — the projects' admin
 * ────────────────────────────────
 * A small server on the Pi, behind Nginx (/api/admin/ → 127.0.0.1:8787): signing in with the
 * admin password, the list of projects, photo uploads. What it saves is on the site at once —
 * Nginx serves /data/ and /projects/ from DATA_DIR/public (server/store.mjs). The admin page
 * itself is /admin/ (src/admin, built with the site).
 *
 *   DATA_DIR=/var/lib/villa-nest node server/admin-server.mjs      (deploy/install-pi.sh runs it as a service)
 *   npm run admin:password                                        (sets the password)
 */
import { randomBytes } from 'node:crypto'
import { watchFile } from 'node:fs'
import { createServer } from 'node:http'
import { checkPassword, passwordIsSet } from './password.mjs'
import { DATA_DIR, UserError, addPhoto, passwordFile, readProjects, saveProjects, seed } from './store.mjs'

const PORT = Number(process.env.ADMIN_PORT ?? 8787)
const HOST = process.env.ADMIN_HOST ?? '127.0.0.1'
const SESSION_MS = 7 * 24 * 3600 * 1000
const MAX_JSON = 8 * 1024 * 1024
const MAX_PHOTO = 40 * 1024 * 1024
/** Wrong passwords: this many from one address, then a pause. */
const MAX_FAILURES = 5
const PAUSE_MS = 15 * 60 * 1000
const COOKIE = 'vn_admin'

/** Signed-in browsers: token → when the session ends (kept in memory: a restart signs everyone out). */
const sessions = new Map()
/** Wrong passwords by address: { count, until }. */
const failures = new Map()

class HttpError extends Error {
  constructor(status, message) {
    super(message)
    this.status = status
  }
}

function send(res, status, body, headers = {}) {
  const json = body === undefined ? '' : JSON.stringify(body)
  res.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store',
    'x-content-type-options': 'nosniff',
    ...headers,
  })
  res.end(json)
}

/** The visitor's address (Cloudflare's, then Nginx's, then the socket's). */
const addressOf = (req) => String(req.headers['x-client-ip'] || req.headers['x-real-ip'] || req.socket.remoteAddress || '')

function cookieOf(req) {
  for (const part of String(req.headers.cookie ?? '').split(';')) {
    const [name, ...value] = part.trim().split('=')
    if (name === COOKIE) return value.join('=')
  }
  return ''
}

function signedIn(req) {
  const token = cookieOf(req)
  const until = token && sessions.get(token)
  if (!until) return false
  if (until < Date.now()) {
    sessions.delete(token)
    return false
  }
  sessions.set(token, Date.now() + SESSION_MS)
  return true
}

function sessionCookie(req, token, maxAge) {
  const secure = req.headers['x-forwarded-proto'] === 'https' ? '; Secure' : ''
  return `${COOKIE}=${token}; Path=/api/admin; HttpOnly; SameSite=Strict; Max-Age=${maxAge}${secure}`
}

/**
 * Changes come from the admin page only: a header no other site's form can send, and (when the
 * browser says where it comes from) this site's own address.
 */
function sameSite(req) {
  if (req.headers['x-villa-nest'] !== '1') return false
  const origin = req.headers.origin
  if (!origin) return true
  // (the names only: a proxy may leave the port out of the Host header)
  const host = String(req.headers['x-forwarded-host'] || req.headers.host || '')
    .replace(/:\d+$/, '')
    .toLowerCase()
  try {
    return new URL(origin).hostname.toLowerCase() === host
  } catch {
    return false
  }
}

/**
 * The request's body. One over `limit` is read to its end and dropped, then refused (413): closing
 * the connection while Nginx still sends it would show a 502 instead of the message.
 */
function readBody(req, limit, tooLarge) {
  return new Promise((resolve, reject) => {
    const chunks = []
    let size = 0
    req.on('data', (chunk) => {
      size += chunk.length
      if (size <= limit) chunks.push(chunk)
      else chunks.length = 0
    })
    req.on('end', () => (size > limit ? reject(new HttpError(413, tooLarge)) : resolve(Buffer.concat(chunks))))
    req.on('error', reject)
  })
}

async function readJson(req) {
  try {
    return JSON.parse((await readBody(req, MAX_JSON, 'Dữ liệu quá lớn.')).toString('utf8'))
  } catch (error) {
    if (error instanceof HttpError) throw error
    throw new HttpError(400, 'Dữ liệu sai dạng.')
  }
}

async function login(req, res) {
  const address = addressOf(req)
  const record = failures.get(address)
  if (record && record.until > Date.now()) {
    const minutes = Math.ceil((record.until - Date.now()) / 60000)
    return send(res, 429, { error: `Sai mật khẩu nhiều lần — thử lại sau ${minutes} phút.` }, { 'retry-after': String(minutes * 60) })
  }
  if (!passwordIsSet()) return send(res, 503, { error: 'Chưa đặt mật khẩu: chạy "npm run admin:password" trên Pi.' })
  const { password } = await readJson(req)
  if (!(await checkPassword(password))) {
    // (counting starts again after a pause)
    const count = record?.until === 0 ? record.count + 1 : 1
    failures.set(address, { count, until: count >= MAX_FAILURES ? Date.now() + PAUSE_MS : 0 })
    // (a wrong password is answered a little later)
    await new Promise((resolve) => setTimeout(resolve, 600))
    return send(res, 401, { error: 'Sai mật khẩu.' })
  }
  failures.delete(address)
  const token = randomBytes(32).toString('base64url')
  sessions.set(token, Date.now() + SESSION_MS)
  send(res, 200, { signedIn: true }, { 'set-cookie': sessionCookie(req, token, SESSION_MS / 1000) })
}

async function handle(req, res) {
  const url = new URL(req.url ?? '/', 'http://admin')
  const path = url.pathname.replace(/\/+$/, '')
  const method = req.method ?? 'GET'
  if (method !== 'GET' && method !== 'HEAD' && !sameSite(req)) throw new HttpError(403, 'Yêu cầu không đến từ trang quản trị.')

  if (path === '/api/admin/session' && method === 'GET') return send(res, 200, { signedIn: signedIn(req), passwordSet: passwordIsSet() })
  if (path === '/api/admin/login' && method === 'POST') return login(req, res)
  if (path === '/api/admin/logout' && method === 'POST') {
    sessions.delete(cookieOf(req))
    return send(res, 200, { signedIn: false }, { 'set-cookie': sessionCookie(req, '', 0) })
  }

  if (!signedIn(req)) throw new HttpError(401, 'Phiên đăng nhập đã hết — đăng nhập lại.')
  if (path === '/api/admin/projects' && method === 'GET') return send(res, 200, { projects: await readProjects() })
  if (path === '/api/admin/projects' && method === 'PUT') {
    const { projects } = await readJson(req)
    return send(res, 200, { projects: await saveProjects(projects) })
  }
  const upload = path.match(/^\/api\/admin\/projects\/([^/]+)\/photos$/)
  if (upload && method === 'POST') {
    if (!/^image\//.test(String(req.headers['content-type']))) throw new HttpError(415, 'Chỉ nhận ảnh.')
    const photo = await addPhoto(decodeURIComponent(upload[1]), await readBody(req, MAX_PHOTO, 'Ảnh quá lớn (tối đa 40 MB).'))
    return send(res, 200, { photo })
  }
  throw new HttpError(404, 'Không có trang này.')
}

await seed()
// A new password (npm run admin:password) signs every browser out.
watchFile(passwordFile, { interval: 3000 }, (now, before) => {
  if (now.mtimeMs !== before.mtimeMs) sessions.clear()
})
const server = createServer((req, res) => {
  handle(req, res).catch((error) => {
    if (res.headersSent) return
    if (error instanceof HttpError) return send(res, error.status, { error: error.message })
    if (error instanceof UserError) return send(res, 400, { error: error.message })
    console.error(error)
    send(res, 500, { error: 'Lỗi máy chủ — trên Pi xem: sudo journalctl -u villa-nest-admin -n 50' })
  })
})
server.requestTimeout = 5 * 60 * 1000
server.listen(PORT, HOST, () => console.log(`VILLA NEST admin: http://${HOST}:${PORT}/api/admin/ (data: ${DATA_DIR})`))
