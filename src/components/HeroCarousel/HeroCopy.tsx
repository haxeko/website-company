import { gsap } from 'gsap'
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import type { Slide } from '../../data/slides'
import { useI18n } from '../../i18n/context'
import { REDUCED_MOTION_QUERY } from '../../utils/device'

interface HeroCopyProps {
  slides: Slide[]
  active: number
  /** Images loaded and the entrance animation started. */
  ready: boolean
}

const pad = (n: number) => String(n).padStart(2, '0')

/**
 * The editorial text of the space in the centre. When the space changes, the lines slide
 * out, the text is swapped and the new lines rise in one after another.
 */
export function HeroCopy({ slides, active, ready }: HeroCopyProps) {
  const { lang } = useI18n()
  const rootRef = useRef<HTMLDivElement>(null)
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
  }, [active, shown])

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
        delay: first && !reduced ? 1.1 : 0.05,
        overwrite: true,
      },
    )
    return () => {
      tween.kill()
    }
  }, [shown, ready])

  const slide = slides[shown]
  const copy = slide.copy[lang]

  return (
    <div ref={rootRef} className="hc-copy">
      <p className="hc-copy__index" data-line>
        <span>{pad(shown + 1)}</span>
        <i aria-hidden="true" />
        <span>{copy.title}</span>
      </p>
      <p className="hc-copy__kicker" data-line>
        {copy.kicker}
      </p>
      <h2 className="hc-copy__headline">
        <span data-line>{copy.headline}</span>
        <em data-line>{copy.accent}</em>
      </h2>
      <p className="hc-copy__description" data-line>
        {copy.description}
      </p>
      <a className="hc-copy__cta" href={slide.ctaHref} data-line>
        <span>{copy.cta}</span>
        <span className="hc-copy__cta-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24">
            <path d="M7 17 17 7M9 7h8v8" />
          </svg>
        </span>
      </a>
    </div>
  )
}
