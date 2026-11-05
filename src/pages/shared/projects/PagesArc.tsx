import { type CSSProperties, type MouseEvent, type Ref } from 'react'
import { useI18n } from '../../../i18n/context'
import type { ProjectCategory } from './data'
import { CraneIcon, HomeMarkIcon, SmartHomeIcon, SofaIcon } from './icons'

/*
 * The site's pages as round buttons set on an arc, as on a dial — the items at these angles of a
 * circle whose centre is off the screen: on a computer down the left margin of a project (the
 * arc bulging towards the page), on a phone along the bottom row beside the Zalo button (bulging
 * up). The line they sit on reaches a little further than they do.
 */
const ARCS = {
  side: { radius: 220, angles: [-33, -11, 11, 33], button: 46, line: 44 },
  dock: { radius: 180, angles: [-30, -10, 10, 30], button: 44, line: 40 },
} as const

type Variant = keyof typeof ARCS

function layout(variant: Variant) {
  const { radius, angles, button, line } = ARCS[variant]
  const at = (deg: number) => {
    const a = (deg * Math.PI) / 180
    const along = radius * Math.sin(a)
    const across = radius * Math.cos(a)
    return variant === 'side' ? { x: across, y: along } : { x: along, y: -across }
  }
  const raw = angles.map(at)
  const minX = Math.min(...raw.map((p) => p.x))
  const minY = Math.min(...raw.map((p) => p.y))
  const shift = (p: { x: number; y: number }) => ({ x: p.x - minX + button / 2, y: p.y - minY + button / 2 })
  const items = raw.map(shift)
  const [a, b] = [shift(at(-line)), shift(at(line))]
  return {
    button,
    items,
    width: Math.max(...items.map((p) => p.x)) + button / 2,
    height: Math.max(...items.map((p) => p.y)) + button / 2,
    line: `M${a.x.toFixed(1)} ${a.y.toFixed(1)}A${radius} ${radius} 0 0 1 ${b.x.toFixed(1)} ${b.y.toFixed(1)}`,
  }
}

const LAYOUTS = { side: layout('side'), dock: layout('dock') }

interface PagesArcProps {
  variant: Variant
  /** The page the projects are on: its button is gold. */
  current: ProjectCategory
  /** What its button does (back to the projects, up to the page's top). */
  onCurrent: () => void
  /** Shown (else its parent sets data-on on `navRef` itself). */
  on?: boolean
  navRef?: Ref<HTMLElement>
}

export function PagesArc({ variant, current, onCurrent, on, navRef }: PagesArcProps) {
  const { t } = useI18n()
  const { button, items, width, height, line } = LAYOUTS[variant]
  const pages = [
    { id: 'home', href: '../', label: t.pageHome, icon: <HomeMarkIcon /> },
    { id: 'smart-home', href: '../smart-home/', label: t.pageSmartHome, icon: <SmartHomeIcon /> },
    { id: 'construction', href: '../construction/', label: t.pageConstruction, icon: <CraneIcon /> },
    { id: 'interior', href: '../interior/', label: t.pageInterior, icon: <SofaIcon /> },
  ]
  const onPage = (id: string) => (e: MouseEvent<HTMLAnchorElement>) => {
    if (id !== current || e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return
    e.preventDefault()
    onCurrent()
  }
  return (
    <nav
      ref={navRef}
      className="pages-arc"
      data-variant={variant}
      data-on={on || undefined}
      aria-label={t.pagesNav}
      style={{ width, height }}
    >
      <svg className="pages-arc__line" width={width} height={height} aria-hidden="true" focusable="false">
        <path d={line} pathLength={1} />
      </svg>
      {pages.map(({ id, href, label, icon }, i) => (
        <a
          key={id}
          className="pages-arc__item"
          href={href}
          aria-current={id === current ? 'page' : undefined}
          onClick={onPage(id)}
          style={{ left: items[i].x - button / 2, top: items[i].y - button / 2, '--i': i } as CSSProperties}
        >
          {icon}
          <span className="pages-arc__label">{label}</span>
        </a>
      ))}
    </nav>
  )
}
