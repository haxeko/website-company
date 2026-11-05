import type { AdminProject, ProjectCategory } from './api'

export const CATEGORY_NAMES: Record<ProjectCategory, string> = { construction: 'Xây dựng', interior: 'Nội thất' }

/** Where a project is on the site (the admin is /admin/). */
export const siteLink = (p: AdminProject) => `../${p.category}/#${p.id}`

/** Whether the site shows it, in a word. */
export const status = (p: AdminProject) => (!p.cover ? 'Chưa có ảnh bìa' : p.hidden ? 'Đang ẩn' : 'Đang hiện')

/** Asked before changes not saved are left behind (the way back, the browser's Back). */
export const UNSAVED = 'Bỏ các thay đổi chưa lưu?'
