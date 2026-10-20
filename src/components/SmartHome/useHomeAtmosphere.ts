import type { RefObject } from 'react'
import type { HomeState } from './homeState'
import { useSmoothVar } from './useSmoothVar'

/** Lifts and warms the wall photo (a ready-made filter string: calc() inside filter functions is not safe everywhere). */
function paintLight(element: HTMLElement, value: number) {
  element.style.setProperty(
    '--sh-img-filter',
    value > 0.001
      ? `brightness(${(1 + 0.36 * value).toFixed(3)}) sepia(${(0.24 * value).toFixed(3)}) saturate(${(1 + 0.12 * value).toFixed(3)})`
      : 'none',
  )
}

/** The curtains are only rendered while they are (partly) drawn. */
function showCurtain(element: HTMLElement, value: number) {
  element.toggleAttribute('data-curtain', value > 0.002)
}

/**
 * Drives the room from the device state through CSS custom properties on `ref`: the lights
 * fade up and down slowly when switched (`--sh-light`), the curtains run like a motor
 * (`--sh-curtain`); slider changes follow quickly.
 */
export function useHomeAtmosphere(ref: RefObject<HTMLElement | null>, { lights, curtain }: HomeState) {
  useSmoothVar(ref, '--sh-light', lights.on ? lights.level / 100 : 0, lights.on, {
    switchDuration: 2.2,
    onUpdate: paintLight,
  })
  useSmoothVar(ref, '--sh-curtain', curtain.on ? curtain.level / 100 : 0, curtain.on, {
    switchDuration: 2.8,
    ease: 'power2.inOut',
    onUpdate: showCurtain,
  })
}
