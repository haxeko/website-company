import { type CSSProperties, type MouseEvent, type ReactNode, type Ref } from 'react'
import { useI18n } from '../../../i18n/context'
import type { ProjectCategory } from './data'
import { CraneIcon, HomeMarkIcon, SmartHomeIcon, SofaIcon } from './icons'

/*
 * The site's pages as round buttons with the line icons of the pages' strips: on a computer set
 * on an arc down the left margin of a project, as on a dial (PagesArc); on a phone in a straight
 * row with their names, in the Zalo button's row (PagesDock).
 */

interface Page {
  id: string
  href: string
  label: string
  icon: ReactNode
}

function usePages(): Page[] {
  const { t } = useI18n()
  return [
    { id: 'home', href: '../', label: t.pageHome, icon: <HomeMarkIcon /> },
    { id: 'smart-home', href: '../smart-home/', label: t.pageSmartHome, icon: <SmartHomeIcon /> },
    { id: 'construction', href: '../construction/', label: t.pageConstruction, icon: <CraneIcon /> },
    { id: 'interior', href: '../interior/', label: t.pageInterior, icon: <SofaIcon /> },
  ]
}

interface PagesProps {
  /** The page the projects are on: its button is gold. */
  current: ProjectCategory
  /** What its button does (back to the projects, up to the page's top). */
  onCurrent: () => void
}

/** The page the projects are on does `onCurrent`; the others are plain links. */
const onPage =
  (id: string, { current, onCurrent }: PagesProps) =>
  (e: MouseEvent<HTMLAnchorElement>) => {
    if (id !== current || e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return
    e.preventDefault()
    onCurrent()
  }

/*
 * The arc: the items at these angles of a circle whose centre is off the screen to the left
 * (the arc bulging towards the page). The line they sit on reaches a little further than they do.
 */
const RADIUS = 220
const ANGLES = [-33, -11, 11, 33]
const BUTTON = 46
const LINE = 44

const ARC = (() => {
  const at = (deg: number) => {
    const a = (deg * Math.PI) / 180
    return { x: RADIUS * Math.cos(a), y: RADIUS * Math.sin(a) }
  }
  const raw = ANGLES.map(at)
  const minX = Math.min(...raw.map((p) => p.x))
  const minY = Math.min(...raw.map((p) => p.y))
  const shift = (p: { x: number; y: number }) => ({ x: p.x - minX + BUTTON / 2, y: p.y - minY + BUTTON / 2 })
  const items = raw.map(shift)
  const [a, b] = [shift(at(-LINE)), shift(at(LINE))]
  return {
    items,
    width: Math.max(...items.map((p) => p.x)) + BUTTON / 2,
    height: Math.max(...items.map((p) => p.y)) + BUTTON / 2,
    line: `M${a.x.toFixed(1)} ${a.y.toFixed(1)}A${RADIUS} ${RADIUS} 0 0 1 ${b.x.toFixed(1)} ${b.y.toFixed(1)}`,
  }
})()

/** Computers: in a project's left margin (its parent sets data-on on `navRef` once the banner is gone). */
export function PagesArc({ navRef, ...props }: PagesProps & { navRef?: Ref<HTMLElement> }) {
  const { t } = useI18n()
  const pages = usePages()
  return (
    <nav ref={navRef} className="pages-arc" aria-label={t.pagesNav} style={{ width: ARC.width, height: ARC.height }}>
      <svg className="pages-arc__line" width={ARC.width} height={ARC.height} aria-hidden="true" focusable="false">
        <path d={ARC.line} pathLength={1} />
      </svg>
      {pages.map(({ id, href, label, icon }, i) => (
        <a
          key={id}
          className="pages-arc__item"
          href={href}
          aria-current={id === props.current ? 'page' : undefined}
          onClick={onPage(id, props)}
          style={{ left: ARC.items[i].x - BUTTON / 2, top: ARC.items[i].y - BUTTON / 2, '--i': i } as CSSProperties}
        >
          {icon}
          <span className="pages-arc__label">{label}</span>
        </a>
      ))}
    </nav>
  )
}

/** Phones: a straight row, each name under its button, from the left edge to the Zalo button. */
export function PagesDock({ on, ...props }: PagesProps & { on: boolean }) {
  const { t } = useI18n()
  const pages = usePages()
  return (
    <nav className="pages-dock" data-on={on || undefined} aria-label={t.pagesNav}>
      {pages.map(({ id, href, label, icon }, i) => (
        <a
          key={id}
          className="pages-dock__item"
          href={href}
          aria-current={id === props.current ? 'page' : undefined}
          onClick={onPage(id, props)}
          style={{ '--i': i } as CSSProperties}
        >
          <span className="pages-dock__icon">{icon}</span>
          <span className="pages-dock__label">{label}</span>
        </a>
      ))}
    </nav>
  )
}
