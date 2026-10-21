import { useCallback, useEffect, useRef, useState, useSyncExternalStore, type RefObject } from 'react'
import { REDUCED_MOTION_QUERY } from '../../utils/device'

/** Phones and portrait tablets: the stacked layout, where the page scrolls. */
export const PORTRAIT_QUERY = '(max-width: 760px), (orientation: portrait) and (max-width: 1024px)'

/** A press becomes a sideways drag after this much travel (px): a tap stays a tap. */
const DRAG_START = 8
/** A drag this long — a share of the hero's width, at most SWIPE_MAX px — moves to the next theme… */
const SWIPE_SHARE = 0.2
const SWIPE_MAX = 90
/** …as does a flick this fast (px / ms) over at least FLICK_MIN px. */
const FLICK_SPEED = 0.3
const FLICK_MIN = 24
/** Pointer history used for the release speed (ms). */
const VELOCITY_WINDOW = 100
/** While dragging: the text follows the finger at this rate, the photo gives a little. */
const FOLLOW = { copy: 0.5, visual: 0.14 }
/** As the home page's carousel: one step per wheel or trackpad gesture… */
const WHEEL_STEP = 40
/** …which ends after this much silence (ms), however long the trackpad's inertia runs. */
const WHEEL_GESTURE_GAP = 200

/** Back into place after a drag; the text of a theme left behind glides on while its lines fade out. */
const SETTLE = { duration: 520, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' }
const CARRY = { duration: 600, easing: 'cubic-bezier(0.25, 0.6, 0.3, 1)' }

function subscribePortrait(onChange: () => void) {
  const query = window.matchMedia(PORTRAIT_QUERY)
  query.addEventListener('change', onChange)
  return () => query.removeEventListener('change', onChange)
}

/** True in the stacked layout (phones, portrait tablets). */
export function usePortrait() {
  return useSyncExternalStore(subscribePortrait, () => window.matchMedia(PORTRAIT_QUERY).matches)
}

/** True while `ref` is on screen. */
export function useOnScreen(ref: RefObject<HTMLElement | null>) {
  const [on, setOn] = useState(true)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(([entry]) => setOn(entry.isIntersecting))
    observer.observe(el)
    return () => observer.disconnect()
  }, [ref])
  return on
}

interface DeckOptions {
  /** The arrow keys work while this element is on screen; a sideways swipe anywhere over it changes the theme. */
  heroRef: RefObject<HTMLElement | null>
  /** Every change of theme, with its direction (the page's own state). */
  onChange?: (index: number, direction: 1 | -1) => void
}

interface Drag {
  id: number
  x: number
  y: number
  active: boolean
  samples: { t: number; x: number }[]
}

/**
 * The themes of a page, changed like the spaces of the home page: the arrows, the numbered
 * navigation, a sideways swipe or drag over the hero, the arrow keys and — where the page is
 * one screen — the mouse wheel or trackpad. Wraps round at both ends.
 */
export function useDeck(count: number, { heroRef, onChange }: DeckOptions) {
  const [active, setActive] = useState(0)
  const [dir, setDir] = useState<1 | -1>(1)
  // (also read by callers that hold on to `show`, such as a demo's timer)
  const activeRef = useRef(0)
  const portrait = usePortrait()
  const onScreen = useOnScreen(heroRef)

  const show = useCallback(
    (index: number) => {
      const current = activeRef.current
      const next = ((index % count) + count) % count
      if (next === current) return
      const direction = (next - current + count) % count <= count / 2 ? 1 : -1
      activeRef.current = next
      setActive(next)
      setDir(direction)
      onChange?.(next, direction)
    },
    [count, onChange],
  )

  // Arrow keys (not while a slider, a set of options or a field has the focus: they move it instead).
  useEffect(() => {
    if (!onScreen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return
      if ((e.target as HTMLElement).closest('input, textarea, select, [contenteditable], [role="slider"], [role="radiogroup"]')) return
      if (e.key === 'ArrowRight') show(activeRef.current + 1)
      else if (e.key === 'ArrowLeft') show(activeRef.current - 1)
      else return
      e.preventDefault()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onScreen, show])

  // The wheel, where the page is one screen; the stacked layout scrolls with it instead.
  const wheel = useRef({ acc: 0, last: -Infinity, locked: false })
  useEffect(() => {
    if (portrait) return
    const onWheel = (e: WheelEvent) => {
      if (e.ctrlKey) return // pinch-zoom
      const scale = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? window.innerHeight : 1
      const delta = (Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY) * scale
      if (!delta) return
      e.preventDefault()
      const w = wheel.current
      if (e.timeStamp - w.last > WHEEL_GESTURE_GAP) {
        w.locked = false
        w.acc = 0
      }
      w.last = e.timeStamp
      if (w.locked) return
      w.acc += delta
      if (Math.abs(w.acc) >= WHEEL_STEP) {
        show(activeRef.current + Math.sign(w.acc))
        w.locked = true
        w.acc = 0
      }
    }
    window.addEventListener('wheel', onWheel, { passive: false })
    return () => window.removeEventListener('wheel', onWheel)
  }, [portrait, show])

  // Swipe or drag sideways anywhere over the hero, as on the home page's carousel: the text
  // (.pg-copy) follows the finger and the photo (.pg-visual) gives a little; past the threshold
  // the arrow it goes to lights up, and on release — or with a flick — the next theme comes,
  // the text carrying on the way it was thrown as it fades. Taps stay taps (on buttons too);
  // fields, sliders and the parts that drag themselves ([data-no-drag]) keep the pointer.
  useEffect(() => {
    const hero = heroRef.current
    if (!hero) return
    let drag: Drag | null = null
    let suppressClick = false
    const reduced = window.matchMedia(REDUCED_MOTION_QUERY)
    const parts = () =>
      [
        [hero.querySelector<HTMLElement>('.pg-copy'), FOLLOW.copy],
        [hero.querySelector<HTMLElement>('.pg-visual'), FOLLOW.visual],
      ] as const
    const threshold = () => Math.min(SWIPE_MAX, hero.clientWidth * SWIPE_SHARE)
    const aim = (step: number) => {
      if (step) hero.dataset.swipe = step > 0 ? 'next' : 'prev'
      else delete hero.dataset.swipe
    }

    const onDown = (e: PointerEvent) => {
      if (!e.isPrimary || (e.pointerType === 'mouse' && e.button !== 0)) return
      if ((e.target as Element).closest('input, select, textarea, [contenteditable], [data-no-drag]')) return
      // A mouse drag would otherwise select text or pick up the photo.
      if (e.pointerType === 'mouse') e.preventDefault()
      drag = { id: e.pointerId, x: e.clientX, y: e.clientY, active: false, samples: [{ t: e.timeStamp, x: e.clientX }] }
    }

    const onMove = (e: PointerEvent) => {
      if (!drag || e.pointerId !== drag.id) return
      const dx = e.clientX - drag.x
      if (!drag.active) {
        const dy = e.clientY - drag.y
        if (Math.abs(dx) < DRAG_START && Math.abs(dy) < DRAG_START) return
        if (Math.abs(dy) >= Math.abs(dx)) {
          drag = null // up or down: the page scrolls
          return
        }
        drag.active = true
        hero.dataset.dragging = ''
        for (const [el] of parts()) el?.getAnimations().forEach((a) => a.cancel())
        try {
          hero.setPointerCapture(e.pointerId)
        } catch {
          // (already released)
        }
      }
      drag.samples.push({ t: e.timeStamp, x: e.clientX })
      while (drag.samples.length > 2 && e.timeStamp - drag.samples[0].t > VELOCITY_WINDOW) drag.samples.shift()
      aim(Math.abs(dx) >= threshold() ? (dx < 0 ? 1 : -1) : 0)
      if (!reduced.matches) for (const [el, rate] of parts()) if (el) el.style.translate = `${dx * rate}px 0`
    }

    const onUp = (e: PointerEvent) => {
      if (!drag || e.pointerId !== drag.id) return
      const { active, samples, x } = drag
      drag = null
      if (!active) return
      delete hero.dataset.dragging
      aim(0)
      if (hero.hasPointerCapture(e.pointerId)) hero.releasePointerCapture(e.pointerId)
      // A mouse drag still ends with a click on what is underneath (a button, the photo): swallow it.
      suppressClick = true
      window.setTimeout(() => (suppressClick = false), 0)

      // (a cancelled pointer has no position of its own: where it was last seen)
      const dx = (e.type === 'pointercancel' ? samples[samples.length - 1].x : e.clientX) - x
      const recent = samples.filter((s) => e.timeStamp - s.t <= VELOCITY_WINDOW)
      const first = recent[0]
      const last = recent[recent.length - 1]
      const speed = recent.length > 1 && last.t > first.t ? (last.x - first.x) / (last.t - first.t) : 0
      const flick = Math.abs(speed) > FLICK_SPEED && Math.abs(dx) > FLICK_MIN && Math.sign(speed) === Math.sign(dx)
      const step = e.type !== 'pointercancel' && (Math.abs(dx) >= threshold() || flick) ? (dx < 0 ? 1 : -1) : 0
      if (step) show(activeRef.current + step)

      for (const [el, rate] of parts()) {
        if (!el) continue
        const from = `${dx * rate}px 0`
        el.style.translate = ''
        if (reduced.matches) continue
        if (step && rate === FOLLOW.copy) el.animate([{ translate: from }, { translate: `${dx * rate * 1.8}px 0` }], CARRY)
        else el.animate([{ translate: from }, { translate: '0px 0' }], SETTLE)
      }
    }

    const onClick = (e: MouseEvent) => {
      if (!suppressClick) return
      e.preventDefault()
      e.stopPropagation()
    }

    hero.addEventListener('pointerdown', onDown)
    window.addEventListener('pointermove', onMove, { passive: true })
    window.addEventListener('pointerup', onUp)
    window.addEventListener('pointercancel', onUp)
    hero.addEventListener('click', onClick, true)
    return () => {
      hero.removeEventListener('pointerdown', onDown)
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      window.removeEventListener('pointercancel', onUp)
      hero.removeEventListener('click', onClick, true)
    }
  }, [heroRef, show])

  return { active, dir, show, portrait, onScreen }
}
