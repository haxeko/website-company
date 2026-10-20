import { useEffect, useLayoutEffect, useRef, type CSSProperties, type ReactNode, type RefObject } from 'react'
// (straight from the modules: the carousel's control-screen styles stay out of this page)
import { snowDensity } from '../../components/SmartHome/homeState'
import { SceneEffects } from '../../components/SmartHome/SceneEffects'
import { useCurtainMotor } from '../../components/SmartHome/useHomeAtmosphere'
import '../../components/SmartHome/linen.css'
import media from '../../data/media.json'
import { PORTRAIT_QUERY } from '../shared/useDeck'
import { coverMapper, quadSize, quadToMatrix3d, type Point, type Quad } from './projection'
import type { PageHome } from './usePageHome'

const PAGE = media.pages['smart-home']
const BASE = `../${media.pages.publicPath}/smart-home`

interface View {
  natural: Point
  offset: Point
  /** Preferred object-position of the photo, 0–1 */
  position: Point
}

const [cropX, cropY, cropW, cropH] = PAGE.portrait.crop
const LANDSCAPE: View = { natural: PAGE.sourceSize as Point, offset: [0, 0], position: [0.74, 0.5] }
const PORTRAIT: View = { natural: [cropW, cropH], offset: [cropX, cropY], position: [0.5, 0.5] }
/** Room kept between the copy and the panel. */
const CLEARANCE = 28

/** The panel's real proportions (the photo shows it turned away from the camera). */
const PANEL_ASPECT = 1.5

const srcSet = (name: string, widths: number[], format: string) =>
  widths.map((w) => `${BASE}${name}-${w}.${format} ${w}w`).join(', ')

interface HeroVisualProps {
  visualRef: RefObject<HTMLDivElement | null>
  home: PageHome
  /** Large screens: the copy beside the photo — the photo is framed so the panel stays clear of it. */
  copyRef: RefObject<HTMLElement | null>
  /** The live control screen, laid onto the glass of the panel. */
  children: ReactNode
  /** Only while the hero is on screen (the particles stop otherwise). */
  visible: boolean
  /** Over the photo, at the front (the arrows). */
  overlay?: ReactNode
  /** Counts the calls to action: each one lights the panel up for a moment. */
  invite: number
  alt: string
}

/**
 * The photo of the stone wall with the panel and the lit villa behind the glass: the live
 * screen is mapped onto the photographed glass with a projective transform, the lamps light
 * or darken the room, the curtain draws across the glass façade, the air-con brings snow.
 */
export function HeroVisual({ visualRef: ref, home, copyRef, children, visible, overlay, invite, alt }: HeroVisualProps) {
  const imgRef = useRef<HTMLImageElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)

  const sheenRef = useRef<HTMLDivElement>(null)

  useCurtainMotor(ref, home.curtain.on ? home.curtain.level / 100 : 0, 0)

  // "Explore": a glow round the glass and a light passing over it.
  useEffect(() => {
    const panel = panelRef.current
    if (!invite || !panel) return
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const rest = 'inset 0 0 0 1px rgb(255 255 255 / 0.04)'
    const lit = 'inset 0 0 0 1px rgb(232 207 159 / 0.55), 0 0 2.4cqw rgb(232 207 159 / 0.38)'
    panel.animate([{ boxShadow: rest }, { boxShadow: lit, offset: 0.3 }, { boxShadow: lit, offset: 0.6 }, { boxShadow: rest }], {
      duration: reduced ? 900 : 2400,
      easing: 'ease-in-out',
    })
    if (!reduced)
      sheenRef.current?.animate(
        [
          { transform: 'translateX(-110%)', opacity: 0 },
          { opacity: 1, offset: 0.25 },
          { transform: 'translateX(110%)', opacity: 0 },
        ],
        { duration: 1500, easing: 'cubic-bezier(0.25, 0.6, 0.3, 1)' },
      )
  }, [invite])

  useLayoutEffect(() => {
    const root = ref.current
    const img = imgRef.current
    const panel = panelRef.current
    if (!root || !img || !panel) return
    const portrait = window.matchMedia(PORTRAIT_QUERY)
    const place = () => {
      const view = portrait.matches ? PORTRAIT : LANDSCAPE
      const box = { width: root.clientWidth, height: root.clientHeight }
      let [fx, fy] = view.position
      const copy = copyRef.current
      if (!portrait.matches && copy) {
        // Narrower screens crop the sides: slide the photo so the panel starts after the copy.
        const { scale } = coverMapper(box, view.natural, view.position)
        const spare = box.width - view.natural[0] * scale
        // (scrollWidth: what the copy really spans, buttons included)
        const clearFrom = copy.getBoundingClientRect().left + copy.scrollWidth - root.getBoundingClientRect().left + CLEARANCE
        const panelLeft = Math.min(PAGE.panel[0][0], PAGE.panel[3][0]) * scale
        if (spare < -1) fx = Math.max(0, Math.min(fx, (clearFrom - panelLeft) / spare))
      }
      img.style.objectPosition = `${(fx * 100).toFixed(2)}% ${(fy * 100).toFixed(2)}%`
      const { map } = coverMapper(box, view.natural, [fx, fy])
      const local = ([x, y]: number[]): Point => map([x - view.offset[0], y - view.offset[1]])
      const quad = PAGE.panel.map(local) as Quad
      const h = quadSize(quad)[1]
      const w = h * PANEL_ASPECT
      panel.style.width = `${w}px`
      panel.style.height = `${h}px`
      panel.style.transform = quadToMatrix3d(w, h, quad)
      root.style.setProperty('--shp-window-x', `${local([PAGE.window[0], 0])[0]}px`)
      root.style.setProperty('--shp-panel-x', `${quad[0][0]}px`)
    }
    place()
    // Again when the photo's box or the copy changes (language, web fonts arriving).
    const observer = new ResizeObserver(place)
    observer.observe(root)
    if (copyRef.current) observer.observe(copyRef.current)
    void document.fonts?.ready.then(place)
    portrait.addEventListener('change', place)
    return () => {
      observer.disconnect()
      portrait.removeEventListener('change', place)
    }
  }, [ref, copyRef])

  const light = home.lights.on ? home.lights.level / 100 : 0

  return (
    <div ref={ref} className="pg-visual shp-visual" style={{ '--shp-light': light } as CSSProperties}>
      <picture>
        <source media={PORTRAIT_QUERY} type="image/avif" srcSet={srcSet('-portrait', PAGE.portrait.widths, 'avif')} sizes="100vw" />
        <source media={PORTRAIT_QUERY} type="image/webp" srcSet={srcSet('-portrait', PAGE.portrait.widths, 'webp')} sizes="100vw" />
        <source type="image/avif" srcSet={srcSet('', PAGE.landscapeWidths, 'avif')} sizes="100vw" />
        <source type="image/webp" srcSet={srcSet('', PAGE.landscapeWidths, 'webp')} sizes="100vw" />
        <img
          ref={imgRef}
          className="shp-visual__img"
          src={`${BASE}-1920.webp`}
          alt={alt}
          decoding="async"
          fetchPriority="high"
        />
      </picture>
      <div className="shp-window" aria-hidden="true">
        <div className="shp-window__drape sh-linen" data-curtain-el />
      </div>
      <div className="shp-visual__dark" aria-hidden="true" />
      <div className="shp-visual__glow" aria-hidden="true" />
      <div ref={panelRef} className="shp-panel">
        {children}
        <div ref={sheenRef} className="shp-panel__sheen" aria-hidden="true" />
      </div>
      <div className="shp-visual__shade" aria-hidden="true" />
      <SceneEffects snow={snowDensity(home)} wind={0} visible={visible} />
      {overlay}
    </div>
  )
}
