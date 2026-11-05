import type { Localized, Project, ProjectCategory, ProjectImage } from '../pages/shared/projects/data'

/*
 * The admin's requests to its server (server/admin-server.mjs, behind /api/admin/). The page is
 * /admin/, one folder down from the site's root.
 */

/** A project as the admin keeps it: possibly hidden from the site, possibly without a cover yet. */
export interface AdminProject extends Omit<Project, 'cover' | 'title'> {
  title: Localized
  hidden?: boolean
  cover: ProjectImage | null
}

export type { Localized, ProjectCategory, ProjectImage }

export class ApiError extends Error {
  readonly status: number
  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

const API = '../api/admin'

async function call<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers)
  // (the server takes changes only with this header: no other site's form can send it)
  headers.set('x-villa-nest', '1')
  if (typeof init.body === 'string') headers.set('content-type', 'application/json')
  let response: Response
  try {
    response = await fetch(`${API}${path}`, { ...init, headers, credentials: 'same-origin' })
  } catch {
    throw new ApiError(0, 'Không kết nối được máy chủ — kiểm tra mạng rồi thử lại.')
  }
  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    // (Nginx's own answers are not JSON: a file over its limit, the admin server not running)
    const fallback =
      response.status === 413
        ? 'Tệp quá lớn (tối đa 40 MB).'
        : response.status === 502 || response.status === 504
          ? 'Máy chủ quản trị không trả lời — trên Pi chạy: sudo systemctl restart villa-nest-admin'
          : `Lỗi máy chủ (${response.status}).`
    throw new ApiError(response.status, data.error ?? fallback)
  }
  return data as T
}

/** Phone photos are big: sent at most this wide (the site's largest is 1920 px). */
const MAX_UPLOAD = 2560

/** A smaller JPEG of the photo when it is larger than needed (the original when it cannot be read here). */
async function shrink(file: File): Promise<Blob> {
  try {
    const bitmap = await createImageBitmap(file)
    const scale = Math.min(1, MAX_UPLOAD / Math.max(bitmap.width, bitmap.height))
    if (scale === 1 && file.size < 4 * 1024 * 1024) {
      bitmap.close()
      return file
    }
    const canvas = document.createElement('canvas')
    canvas.width = Math.round(bitmap.width * scale)
    canvas.height = Math.round(bitmap.height * scale)
    canvas.getContext('2d')?.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
    bitmap.close()
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.92))
    return blob ?? file
  } catch {
    return file
  }
}

export const api = {
  session: () => call<{ signedIn: boolean; passwordSet: boolean }>('/session'),
  login: (password: string) => call<{ signedIn: boolean }>('/login', { method: 'POST', body: JSON.stringify({ password }) }),
  logout: () => call<{ signedIn: boolean }>('/logout', { method: 'POST' }),
  projects: () => call<{ projects: AdminProject[] }>('/projects'),
  save: (projects: AdminProject[]) =>
    call<{ projects: AdminProject[] }>('/projects', { method: 'PUT', body: JSON.stringify({ projects }) }),
  async upload(id: string, file: File) {
    const body = await shrink(file)
    return call<{ photo: ProjectImage }>(`/projects/${encodeURIComponent(id)}/photos`, {
      method: 'POST',
      body,
      headers: { 'content-type': body.type || file.type || 'image/jpeg' },
    })
  },
}

/** A project's id from its name: "Biệt thự Thảo Điền" → "biet-thu-thao-dien" (unique among `taken`). */
export function idFor(name: string, taken: Set<string>) {
  const slug =
    name
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/đ/g, 'd')
      .replace(/Đ/g, 'd')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 60)
      .replace(/-+$/, '') || 'du-an'
  let id = slug
  for (let n = 2; taken.has(id); n++) id = `${slug}-${n}`
  return id
}
