import { useEffect, useRef, type CSSProperties, type PointerEvent, type ReactNode, type RefObject } from 'react'
import media from '../../data/media.json'
import { MOODS, type InteriorCopy, type MoodId } from './content'

const PAGE = media.pages.interior
const BASE = `../${media.pages.publicPath}`
const [W, H] = PAGE.sourceSize
const WIDTHS = PAGE.landscapeWidths

/** The photo of each light (the golden hour is the original). */
const IMAGE: Record<MoodId, string> = { morning: 'interior-morning', golden: 'interior', evening: 'interior-evening' }

/** Where each material is in the photo (photo px), in the order of the copy. */
const POINTS: [number, number][] = [
  [2620, 1150],
  [1800, 1260],
  [2050, 1668],
  [1450, 1905],
  [1560, 2035],
  [1180, 1398],
]
/** Its swatch, cut from the photo (the brass pendant's is drawn). */
const SWATCHES = ['travertine', 'walnut', 'marble', 'boucle', 'wool', null] as const

/** The made-to-measure pieces' dimension lines (photo px), in the order of the copy. */
const DIMS: { from: [number, number]; to: [number, number] }[] = [
  { from: [1150, 1712], to: [2700, 1712] },
  { from: [1760, 1955], to: [2600, 1955] },
  { from: [900, 1625], to: [1480, 1625] },
  { from: [1290, 1095], to: [1290, 1605] },
]

const srcSet = (name: string, format: string) => WIDTHS.map((w) => `${BASE}/${name}-${w}.${format} ${w}w`).join(', ')
const at = (x: number, y: number) => ({ left: `${(x / W) * 100}%`, top: `${(y / H) * 100}%` })

export function Swatch({ index, className }: { index: number; className: string }) {
  const name = SWATCHES[index]
  return name ? (
    <img className={className} src={`${BASE}/swatch-${name}-160.webp`} alt="" decoding="async" />
  ) : (
    <i className={`${className} ip-swatch--brass`} aria-hidden="true" />
  )
}

interface RoomVisualProps {
  visualRef: RefObject<HTMLDivElement | null>
  copy: InteriorCopy
  /** The facet (theme) on show: 0 space, 1 materials, 2 light, 3 made to measure. */
  facet: number
  mood: MoodId
  /** The material whose card is open (materials). */
  selected: number
  onSelect: (index: number) => void
  /** Counts the calls to action on the space: each one walks slowly into the room. */
  walk: number
  /** Counts the calls to action on the sizes: each one draws them again. */
  redraw: number
  overlay?: ReactNode
  alt: string
}

/**
 * The living room in three lights (morning, golden hour, evening — each its own photo,
 * cross-faded), the points on its materials, and the made-to-measure pieces' dimension lines
 * drawn over it. On a computer the room follows the pointer a little, for depth.
 */
export function RoomVisual({ visualRef, copy, facet, mood, selected, onSelect, walk, redraw, overlay, alt }: RoomVisualProps) {
  const boxRef = useRef<HTMLDivElement>(null)

  // "Explore" on the space: a slow walk into the room.
  useEffect(() => {
    const box = boxRef.current
    if (!walk || !box || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    box.animate([{ scale: 1 }, { scale: 1.07, offset: 0.55 }, { scale: 1 }], { duration: 6400, easing: 'cubic-bezier(0.45, 0, 0.3, 1)' })
  }, [walk])

  // A touch of depth: the room drifts with the pointer (fine pointers only).
  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== 'mouse') return
    const r = e.currentTarget.getBoundingClientRect()
    e.currentTarget.style.setProperty('--ip-mx', ((e.clientX - r.left) / r.width - 0.5).toFixed(3))
    e.currentTarget.style.setProperty('--ip-my', ((e.clientY - r.top) / r.height - 0.5).toFixed(3))
  }

  return (
    <div
      ref={visualRef}
      className="pg-visual ip-visual"
      data-facet={facet}
      data-mood={mood}
      style={{ '--ip-aspect': W / H } as CSSProperties}
      onPointerMove={onPointerMove}
    >
      <div ref={boxRef} className="ip-box">
        {MOODS.map((m) => (
          <picture key={m} className="ip-room" data-on={m === mood || undefined}>
            <source type="image/avif" srcSet={srcSet(IMAGE[m], 'avif')} sizes="100vw" />
            <source type="image/webp" srcSet={srcSet(IMAGE[m], 'webp')} sizes="100vw" />
            <img
              src={`${BASE}/${IMAGE[m]}-1920.webp`}
              alt={m === 'golden' ? alt : ''}
              decoding="async"
              fetchPriority={m === 'golden' ? 'high' : 'low'}
            />
          </picture>
        ))}

        <svg key={redraw} className="ip-dims" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" aria-hidden="true">
          {DIMS.map(({ from, to }, i) => {
            const vertical = from[0] === to[0]
            const tick = (x: number, y: number) => (vertical ? `M${x - 34} ${y}h68` : `M${x} ${y - 34}v68`)
            return (
              <g key={i} style={{ '--i': i } as CSSProperties}>
                <line className="ip-dim" x1={from[0]} y1={from[1]} x2={to[0]} y2={to[1]} pathLength={1} />
                <path className="ip-dim" d={`${tick(...from)}${tick(...to)}`} pathLength={1} />
              </g>
            )
          })}
        </svg>
        {DIMS.map(({ from, to }, i) => (
          <span
            key={i}
            className="ip-dim-label"
            data-vertical={from[0] === to[0] || undefined}
            style={{ ...at((from[0] + to[0]) / 2, (from[1] + to[1]) / 2), '--i': i } as CSSProperties}
          >
            <small>{copy.dims[i][0]}</small>
            <b>{copy.dims[i][1]}</b>
          </span>
        ))}

        <div className="ip-points" role="group" aria-label={copy.features.materials.title}>
          {POINTS.map(([x, y], i) => (
            <button
              key={i}
              type="button"
              className="ip-point"
              style={{ ...at(x, y), '--i': i } as CSSProperties}
              aria-pressed={i === selected}
              aria-label={copy.materials[i].name}
              tabIndex={facet === 1 ? 0 : -1}
              onClick={() => onSelect(i)}
            >
              <span className="ip-point__label" aria-hidden="true">
                {copy.materials[i].name}
              </span>
            </button>
          ))}
        </div>
      </div>
      <div className="ip-shade" aria-hidden="true" />
      {overlay}
    </div>
  )
}
