import { gsap } from 'gsap'
import { useEffect, useEffectEvent, useRef, type RefObject } from 'react'
import { REDUCED_MOTION_QUERY } from '../../utils/device'

interface SmoothVarOptions {
  /** Seconds when the device was just switched on or off (a slow fade, a curtain motor). */
  switchDuration: number
  /** Seconds for a level change from a slider. */
  adjustDuration?: number
  /** Ease of the switch animation. */
  ease?: string
  /** Called with the current value on every animation frame. */
  onUpdate?: (element: HTMLElement, value: number) => void
}

/**
 * Animates the CSS custom property `name` on `ref` towards `target` (0–1): slowly when the
 * device has just been switched on or off, quickly while a slider is being dragged.
 */
export function useSmoothVar(
  ref: RefObject<HTMLElement | null>,
  name: string,
  target: number,
  on: boolean,
  { switchDuration, adjustDuration = 0.45, ease = 'sine.inOut', onUpdate }: SmoothVarOptions,
) {
  const state = useRef({ value: target, on })
  const update = useEffectEvent((element: HTMLElement, value: number) => onUpdate?.(element, value))

  useEffect(() => {
    const element = ref.current
    if (!element) return
    const current = state.current
    const switched = current.on !== on
    current.on = on
    const reduced = window.matchMedia(REDUCED_MOTION_QUERY).matches
    const apply = () => {
      element.style.setProperty(name, current.value.toFixed(4))
      update(element, current.value)
    }
    if (Math.abs(current.value - target) < 1e-4) {
      apply()
      return
    }
    const tween = gsap.to(current, {
      value: target,
      duration: reduced ? 0.3 : switched ? switchDuration : adjustDuration,
      ease: switched ? ease : 'power2.out',
      overwrite: true,
      onUpdate: apply,
    })
    return () => {
      tween.kill()
    }
  }, [ref, name, target, on, switchDuration, adjustDuration, ease])
}
