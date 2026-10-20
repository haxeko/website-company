import { gsap } from 'gsap'
import { useEffect, useLayoutEffect, useRef, useState, type RefObject } from 'react'
import { REDUCED_MOTION_QUERY } from '../../utils/device'

/**
 * The editorial text's change of slide (home page and Smart Home page): when `active`
 * changes, the `[data-line]` elements inside `rootRef` slide out, the content is swapped
 * (the returned index follows) and the new lines rise in one after another.
 * Nothing shows before `ready`; `introDelay` = wait before the very first reveal.
 */
export function useLineSwap(rootRef: RefObject<HTMLElement | null>, active: number, ready: boolean, introDelay = 1.1) {
  const [shown, setShown] = useState(active)
  const entered = useRef(false)

  // Out: lines leave, then the content is swapped.
  useEffect(() => {
    if (active === shown) return
    const lines = rootRef.current?.querySelectorAll('[data-line]')
    if (!lines?.length || !entered.current) {
      setShown(active)
      return
    }
    const reduced = window.matchMedia(REDUCED_MOTION_QUERY).matches
    const tween = gsap.to(lines, {
      opacity: 0,
      y: reduced ? 0 : -16,
      duration: reduced ? 0.2 : 0.38,
      ease: 'power2.in',
      stagger: reduced ? 0 : 0.035,
      overwrite: true,
      onComplete: () => setShown(active),
    })
    return () => {
      tween.kill()
    }
  }, [rootRef, active, shown])

  // In: on first reveal and after every swap.
  useLayoutEffect(() => {
    const lines = rootRef.current?.querySelectorAll('[data-line]')
    if (!lines?.length) return
    if (!ready) {
      gsap.set(lines, { opacity: 0 })
      return
    }
    const reduced = window.matchMedia(REDUCED_MOTION_QUERY).matches
    const first = !entered.current
    entered.current = true
    const tween = gsap.fromTo(
      lines,
      { opacity: 0, y: reduced ? 0 : 28 },
      {
        opacity: 1,
        y: 0,
        duration: reduced ? 0.3 : 1.05,
        ease: 'power3.out',
        stagger: reduced ? 0 : 0.075,
        delay: first && !reduced ? introDelay : 0.05,
        overwrite: true,
      },
    )
    return () => {
      tween.kill()
    }
  }, [rootRef, shown, ready, introDelay])

  return shown
}
