import { useEffect, useState } from 'react'
import type { Lang } from '../../../i18n/strings'

/*
 * The projects of the Construction and Interior pages: public/data/projects.json, written by
 * `npm run projects` from content/projects/ — read when the page opens (always checked afresh,
 * so a newly added project shows at once), the photos from public/projects/.
 */

export type Localized = Record<Lang, string>
export type ProjectCategory = 'construction' | 'interior'

/** What was built, for the pages' filter (chosen in the admin when a project is added). */
export const PROJECT_TYPES = ['townhouse', 'villa', 'garden-house', 'restaurant', 'cafe', 'shop'] as const
export type ProjectType = (typeof PROJECT_TYPES)[number]

export const PROJECT_TYPE_NAMES: Record<ProjectType, Localized> = {
  townhouse: { vi: 'Nhà phố', en: 'Townhouse' },
  villa: { vi: 'Biệt thự', en: 'Villa' },
  'garden-house': { vi: 'Nhà vườn', en: 'Garden house' },
  restaurant: { vi: 'Nhà hàng', en: 'Restaurant' },
  cafe: { vi: 'Quán cafe', en: 'Café' },
  shop: { vi: 'Shop bán hàng', en: 'Shop' },
}

export interface ProjectImage {
  /** `projects/<id>/<photo>.<key>`: the files are `<base>-<width>.avif / .webp`. */
  base: string
  widths: number[]
  /** The photo's size (its proportions). */
  w: number
  h: number
  /** Where a square or narrow frame centres on (object-position, 0–1). */
  focus?: [number, number]
  caption?: Localized
}

export interface Project {
  id: string
  category: ProjectCategory
  type?: ProjectType
  /** An illustrative project (the site's concept images). */
  sample?: boolean
  title: Localized
  place?: Localized
  year?: string
  area?: string
  scope?: Localized
  summary?: Localized
  cover: ProjectImage
  photos: ProjectImage[]
}

/** The pages are one folder down from the site's root. */
const ROOT = '../'

export const imageSrcSet = (img: ProjectImage, ext: 'avif' | 'webp') =>
  img.widths.map((w) => `${ROOT}${img.base}-${w}.${ext} ${w}w`).join(', ')

/** The middle width, for browsers that pick from `src` alone. */
export const imageSrc = (img: ProjectImage) => `${ROOT}${img.base}-${img.widths[Math.min(1, img.widths.length - 1)]}.webp`

export const imagePosition = (img: ProjectImage) => (img.focus ? `${img.focus[0] * 100}% ${img.focus[1] * 100}%` : undefined)

let loading: Promise<Project[]> | null = null

export function loadProjects(): Promise<Project[]> {
  loading ??= fetch(`${ROOT}data/projects.json`, { cache: 'no-cache' })
    .then((response) => (response.ok ? response.json() : { projects: [] }))
    .then((data: { projects?: Project[] }) => data.projects ?? [])
    .catch(() => [])
  return loading
}

/** The projects of one page, in order (null until they are read). */
export function useProjects(category: ProjectCategory) {
  const [list, setList] = useState<Project[] | null>(null)
  useEffect(() => {
    let live = true
    void loadProjects().then((all) => {
      if (live) setList(all.filter((p) => p.category === category))
    })
    return () => {
      live = false
    }
  }, [category])
  return list
}

const preloaded = new Set<string>()

/** Starts fetching the project page's banner before it is needed (a pointer over the project). */
export function preloadCover(project: Project) {
  if (preloaded.has(project.id)) return
  preloaded.add(project.id)
  const link = document.createElement('link')
  link.rel = 'preload'
  link.as = 'image'
  link.type = 'image/avif'
  link.setAttribute('imagesrcset', imageSrcSet(project.cover, 'avif'))
  link.setAttribute('imagesizes', '100vw')
  document.head.append(link)
}
