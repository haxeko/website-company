import { useCallback, useEffect, useRef, useState, useSyncExternalStore, type RefObject } from 'react'

/** Phones and portrait tablets: the stacked layout, where the page scrolls. */
export const PORTRAIT_QUERY = '(max-width: 760px), (orientation: portrait) and (max-width: 1024px)'

/** As the home page's carousel: one step per wheel or trackpad gesture… */
const WHEEL_STEP = 40
/** …which ends after this much silence (ms), however long the trackpad's inertia runs. */
const WHEEL_GESTURE_GAP = 200

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
  /** The arrow keys work while this element is on screen. */
  heroRef: RefObject<HTMLElement | null>
  /** Every change of theme, with its direction (the page's own state). */
  onChange?: (index: number, direction: 1 | -1) => void
}

/**
 * The themes of a page, changed with the arrows, the numbered navigation, the arrow keys and —
 * where the page is one screen — the mouse wheel or trackpad (not by swiping: on a phone the
 * page only scrolls). Wraps round at both ends.
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

  return { active, dir, show, portrait, onScreen }
}
