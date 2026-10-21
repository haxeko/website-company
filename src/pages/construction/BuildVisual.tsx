import { gsap } from 'gsap'
import {
  useCallback,
  useEffect,
  useEffectEvent,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type PointerEvent,
  type ReactNode,
  type RefObject,
} from 'react'
import media from '../../data/media.json'
import { PORTRAIT_QUERY, usePortrait } from '../shared/useDeck'
import type { ConstructionCopy } from './content'
import { KeyIcon, TickIcon } from './icons'

const PAGE = media.pages.construction
const BASE = `../${media.pages.publicPath}`
const [PX, , PW, PH] = PAGE.portrait.crop
const [LW, LH] = PAGE.sourceSize

/**
 * Where the laser line stands for each phase (share of the image width that is still
 * drawing): design, structure (the frame's callouts on the photo), progress, handover.
 */
const LINE = { landscape: [0.66, 0.46, 0.36, 0], portrait: [0.7, 0.22, 0.3, 0] }
/** Weeks of the sample build, and where each phase ends (share of the build). */
const WEEKS = 38
const PHASE_ENDS = [8 / 38, 20 / 38, 28 / 38, 1]

/* The drawing's annotations, in photo pixels (the landscape crop starts at 0). */
const LEVELS_Y = [322, 966, 1745]
const AXES: [string, number][] = [
  ['A', 1464],
  ['B', 2852],
  ['C', 3299],
  ['D', 4146],
  ['E', 5160],
]
const DIM_Y = 1885
/** 179 px to the metre (one storey of 3.6 m is 644 px in the photo). */
const PX_PER_MM = 644 / 3600
/**
 * What the callouts point at, on the photographed frame — and, on phones, which way a label
 * opens where the photo's edge is near (otherwise up and to the right).
 */
const CALLOUTS: [number, number, ('left' | 'down')[]][] = [
  [3299, 1560, []],
  [4146, 1025, []],
  [3950, 420, ['down', 'left']],
  [4700, 1387, ['down', 'left']],
]

const srcSet = (name: string, widths: number[], format: string) => widths.map((w) => `${BASE}/${name}-${w}.${format} ${w}w`).join(', ')

interface LayersProps {
  name: string
  widths: number[]
  portraitWidths: number[]
  alt: string
  className: string
  priority?: boolean
}

function Layers({ name, widths, portraitWidths, alt, className, priority }: LayersProps) {
  return (
    <picture className={className}>
      <source media={PORTRAIT_QUERY} type="image/avif" srcSet={srcSet(`${name}-portrait`, portraitWidths, 'avif')} sizes="100vw" />
      <source media={PORTRAIT_QUERY} type="image/webp" srcSet={srcSet(`${name}-portrait`, portraitWidths, 'webp')} sizes="100vw" />
      <source type="image/avif" srcSet={srcSet(name, widths, 'avif')} sizes="100vw" />
      <source type="image/webp" srcSet={srcSet(name, widths, 'webp')} sizes="100vw" />
      <img src={`${BASE}/${name}-1920.webp`} alt={alt} decoding="async" fetchPriority={priority ? 'high' : 'auto'} />
    </picture>
  )
}

interface BuildVisualProps {
  visualRef: RefObject<HTMLDivElement | null>
  copy: ConstructionCopy
  /** The phase (theme) on show. */
  phase: number
  /** Counts the calls to action: each one sweeps the line across once. */
  sweep: number
  /** Over the photo, at the front (the arrows). */
  overlay?: ReactNode
  /** Phones: the story is open under the photo, in place of the phase's card. */
  storyOpen: boolean
  /** Shown by the handle for a moment, after the call to action. */
  hint?: string
  alt: string
}

/**
 * The villa being built, twice over: the photograph, and the architect's drawing of the same
 * view on charcoal paper with its levels, grid and dimensions. A laser line divides them —
 * drawing to the left, the building to the right — and can be dragged (or moved with the
 * arrow keys): what is "built" follows it, and so does the site's progress card. Each phase
 * moves the line, shows the frame's callouts, the progress card or the handover.
 */
export function BuildVisual({ visualRef, copy, phase, sweep, overlay, storyOpen, hint, alt }: BuildVisualProps) {
  const portrait = usePortrait()
  const boxRef = useRef<HTMLDivElement>(null)
  const line = useRef({ v: LINE.landscape[0] })
  const tween = useRef<gsap.core.Animation | null>(null)
  const [built, setBuilt] = useState(Math.round((1 - LINE.landscape[0]) * 100))
  const [dragging, setDragging] = useState(false)

  const apply = useCallback(() => {
    const v = line.current.v
    visualRef.current?.style.setProperty('--line', v.toFixed(4))
    setBuilt(Math.round((1 - v) * 100))
  }, [visualRef])

  const moveTo = useCallback(
    (target: number, duration = 1.4) => {
      tween.current?.kill()
      const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      tween.current = gsap.to(line.current, { v: target, duration: reduced ? 0 : duration, ease: 'power3.inOut', onUpdate: apply })
      if (reduced) apply()
    },
    [apply],
  )

  const targets = portrait ? LINE.portrait : LINE.landscape
  // Each phase brings the line to its place.
  useEffect(() => moveTo(targets[phase]), [phase, targets, moveTo])

  // "Explore": all drawing, then all built, then back to the phase.
  const runSweep = useEffectEvent(() => {
    tween.current?.kill()
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    tween.current = gsap
      .timeline()
      .to(line.current, { v: 1, duration: 0.9, ease: 'power2.inOut', onUpdate: apply })
      .to(line.current, { v: 0, duration: 2.2, ease: 'power2.inOut', onUpdate: apply })
      .to(line.current, { v: targets[phase], duration: 1.1, ease: 'power3.inOut', onUpdate: apply })
  })
  useEffect(() => {
    if (sweep) runSweep()
  }, [sweep])

  useEffect(() => () => void tween.current?.kill(), [])

  // Dragging the line (its handle, or the beam itself).
  const fromPointer = (clientX: number) => {
    const box = boxRef.current?.getBoundingClientRect()
    if (!box) return
    tween.current?.kill()
    line.current.v = Math.min(1, Math.max(0, (clientX - box.left) / box.width))
    apply()
  }
  // A finger on the line may only be scrolling the page: the line follows once it moves sideways.
  const pending = useRef<{ id: number; x: number; y: number } | null>(null)
  const onPointerDown = (e: PointerEvent<HTMLElement>) => {
    if (e.button !== 0) return
    // (no text selection, no native drag of the photo under it: either would cancel the pointer)
    e.preventDefault()
    if (e.pointerType !== 'mouse') {
      pending.current = { id: e.pointerId, x: e.clientX, y: e.clientY }
      return
    }
    e.currentTarget.setPointerCapture(e.pointerId)
    setDragging(true)
    fromPointer(e.clientX)
  }
  const onPointerMove = (e: PointerEvent<HTMLElement>) => {
    const start = pending.current
    if (start?.id === e.pointerId) {
      const dx = e.clientX - start.x
      const dy = e.clientY - start.y
      if (Math.abs(dx) < 6 && Math.abs(dy) < 6) return
      pending.current = null
      if (Math.abs(dy) >= Math.abs(dx)) return // up or down: the page scrolls (touch-action: pan-y)
      e.currentTarget.setPointerCapture(e.pointerId)
      setDragging(true)
    }
    if (dragging || start) fromPointer(e.clientX)
  }
  const onPointerUp = () => {
    pending.current = null
    setDragging(false)
  }
  const onKeyDown = (e: KeyboardEvent<HTMLElement>) => {
    const step = e.shiftKey ? 0.1 : 0.04
    let v = line.current.v
    if (e.key === 'ArrowLeft') v -= step
    else if (e.key === 'ArrowRight') v += step
    else if (e.key === 'Home') v = 0
    else if (e.key === 'End') v = 1
    else return
    e.preventDefault()
    e.stopPropagation()
    moveTo(Math.min(1, Math.max(0, v)), 0.35)
  }

  // The sample build's week and phases follow what is built.
  const share = built / 100
  const week = Math.max(1, Math.round(share * WEEKS))
  const current = PHASE_ENDS.findIndex((end) => share < end - 0.001)
  const phaseState = (i: number) => (current === -1 || i < current ? 'done' : i === current ? 'now' : 'next')

  const view = portrait ? { x: PX, y: 0, w: PW, h: PH } : { x: 0, y: 0, w: LW, h: LH }
  const pct = (x: number, y: number) => ({ left: `${((x - view.x) / view.w) * 100}%`, top: `${((y - view.y) / view.h) * 100}%` })
  const levelX = portrait ? 2420 : 2960
  const dims = AXES.slice(1).map(([, x], i) => ({ x0: AXES[i][1], x1: x, mm: Math.round((x - AXES[i][1]) / PX_PER_MM / 50) * 50 }))

  return (
    <>
      <div
        ref={visualRef}
        className="pg-visual cp-visual"
        data-phase={phase}
        data-dragging={dragging || undefined}
        style={{ '--cp-aspect': `${view.w} / ${view.h}`, '--line': LINE.landscape[0] } as CSSProperties}
      >
        <div ref={boxRef} className="cp-box">
          <Layers
            name="construction"
            widths={PAGE.landscapeWidths}
            portraitWidths={PAGE.portrait.widths}
            alt={alt}
            className="cp-photo"
            priority
          />
          <div className="cp-glow" aria-hidden="true" />

          <div className="cp-drawing" aria-hidden="true">
            <div className="cp-paper" />
            <Layers
              name="construction-drawing"
              widths={PAGE.extras[0].widths}
              portraitWidths={PAGE.extras[1].widths}
              alt=""
              className="cp-ink"
            />
            <svg className="cp-marks" viewBox={`${view.x} ${view.y} ${view.w} ${view.h}`} preserveAspectRatio="none">
              {AXES.map(([name, x]) => (
                <g key={name}>
                  <line className="cp-mark cp-mark--axis" x1={x} y1={205} x2={x} y2={DIM_Y + 60} pathLength={1} />
                  <circle className="cp-mark" cx={x} cy={150} r={52} pathLength={1} />
                </g>
              ))}
              {LEVELS_Y.map((y) => (
                <g key={y}>
                  <line
                    className="cp-mark"
                    x1={levelX - (portrait ? 120 : 1500)}
                    y1={y}
                    x2={levelX + (portrait ? 900 : 360)}
                    y2={y}
                    pathLength={1}
                  />
                  <path className="cp-mark" d={`M${levelX} ${y} l-34 -58 h68 z`} pathLength={1} />
                </g>
              ))}
              <line className="cp-mark" x1={AXES[0][1]} y1={DIM_Y} x2={AXES[AXES.length - 1][1]} y2={DIM_Y} pathLength={1} />
              {AXES.map(([name, x]) => (
                <line key={name} className="cp-mark" x1={x - 26} y1={DIM_Y + 26} x2={x + 26} y2={DIM_Y - 26} pathLength={1} />
              ))}
            </svg>
            {AXES.map(([name, x]) => (
              <span key={name} className="cp-label cp-label--axis" style={pct(x, 150)}>
                {name}
              </span>
            ))}
            {LEVELS_Y.map((y, i) => (
              <span key={y} className="cp-label cp-label--level" style={pct(levelX + 60, y)}>
                <b>{copy.levels[i][1]}</b> {copy.levels[i][0]}
              </span>
            ))}
            {dims.map(({ x0, x1, mm }) => (
              <span key={x0} className="cp-label cp-label--dim" style={pct((x0 + x1) / 2, DIM_Y)}>
                {mm.toLocaleString('vi-VN').replace(/\./g, ' ')}
              </span>
            ))}
          </div>

          <div className="cp-callouts" aria-hidden={phase !== 1}>
            {CALLOUTS.map(([x, y, side], i) => (
              <div
                key={i}
                className="cp-callout"
                style={{ ...pct(x, y), '--i': i } as CSSProperties}
                data-side={(portrait && side.join(' ')) || undefined}
              >
                <i className="cp-callout__dot" />
                <span className="cp-callout__label">
                  <b>{copy.callouts[i][0]}</b>
                  <small>{copy.callouts[i][1]}</small>
                </span>
              </div>
            ))}
          </div>

          <div className="cp-shade" aria-hidden="true" />

          <div
            className="cp-line"
            data-no-drag
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
          >
            <span className="cp-line__beam" aria-hidden="true" />
            <span className="cp-tag cp-tag--drawing" aria-hidden="true">
              {copy.drawing}
            </span>
            <span className="cp-tag cp-tag--built" aria-hidden="true">
              {copy.built}
            </span>
            <span
              className="cp-line__handle"
              role="slider"
              tabIndex={0}
              aria-label={copy.handle}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={built}
              aria-valuetext={copy.builtValue.replace('{n}', String(built))}
              onKeyDown={onKeyDown}
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="m9.5 7-5 5 5 5M14.5 7l5 5-5 5" />
              </svg>
            </span>
            <span className="cp-line__hint" role="status" data-on={hint ? true : undefined}>
              {hint}
            </span>
          </div>
        </div>
        {overlay}
      </div>

      <aside className="cp-card cp-card--progress" data-on={(phase === 2 && !storyOpen) || undefined} aria-hidden={phase !== 2}>
        <p className="cp-card__title">{copy.progress.title}</p>
        <p className="cp-card__project">{copy.progress.project}</p>
        <p className="cp-card__value">
          <b>{built}%</b>
          <span>{copy.progress.week.replace('{n}', String(week)).replace('{total}', String(WEEKS))}</span>
        </p>
        <i className="cp-card__bar" style={{ '--v': share } as CSSProperties} />
        <ol className="cp-card__phases">
          {copy.progress.phases.map(([name, weeks], i) => (
            <li key={name} data-state={phaseState(i)}>
              <span>{name}</span>
              <small>{weeks}</small>
            </li>
          ))}
        </ol>
        <p className="cp-card__note">{copy.progress.handover}</p>
        <p className="cp-card__note">{copy.progress.today}</p>
      </aside>

      <aside className="cp-card cp-card--handover" data-on={(phase === 3 && !storyOpen) || undefined} aria-hidden={phase !== 3}>
        <p className="cp-card__title">{copy.handover.title}</p>
        <p className="cp-card__key">
          <KeyIcon />
          {copy.handover.date}
        </p>
        <ul className="cp-card__list">
          {copy.handover.items.map((item) => (
            <li key={item}>
              <TickIcon />
              {item}
            </li>
          ))}
        </ul>
      </aside>
    </>
  )
}
