import {
  useEffect,
  useEffectEvent,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
  useState,
  type Ref,
} from 'react'
import { carouselConfig } from '../../config/animation'
import type { Slide } from '../../data/slides'
import { getQualityHint } from '../../utils/device'
import { CarouselEngine } from './CarouselEngine'
import { SlideImage } from './SlideImage'
import './HeroCarousel.css'

export interface HeroCarouselHandle {
  goTo: (index: number) => void
  next: () => void
  prev: () => void
}

interface HeroCarouselProps {
  slides: Slide[]
  ref?: Ref<HeroCarouselHandle>
  /** False while something covers the carousel (e.g. the menu): disables drag / wheel / keys. */
  interactive?: boolean
  onActiveChange?: (index: number) => void
  /** 0 → 1 while the slide images load and decode. */
  onLoadProgress?: (ratio: number) => void
  /** Called when the images are ready and the entrance animation starts. */
  onReady?: () => void
}

/** Never keep the visitor waiting longer than this for slow images. */
const IMAGE_TIMEOUT = 8000

function Chevron({ direction }: { direction: 'left' | 'right' }) {
  return (
    <svg viewBox="0 0 16 32" aria-hidden="true">
      <path d={direction === 'left' ? 'M14.5 1.5 2 16l12.5 14.5' : 'M1.5 1.5 14 16 1.5 30.5'} />
    </svg>
  )
}

export function HeroCarousel({
  slides,
  ref,
  interactive = true,
  onActiveChange,
  onLoadProgress,
  onReady,
}: HeroCarouselProps) {
  const rootRef = useRef<HTMLElement>(null)
  const stageRef = useRef<HTMLDivElement>(null)
  const slideRefs = useRef<(HTMLDivElement | null)[]>([])
  const ambientRefs = useRef<(HTMLDivElement | null)[]>([])
  const engineRef = useRef<CarouselEngine | null>(null)
  const [active, setActive] = useState(carouselConfig.initialIndex)

  const handleActive = useEffectEvent((index: number) => {
    setActive(index)
    onActiveChange?.(index)
  })
  const handleProgress = useEffectEvent((ratio: number) => onLoadProgress?.(ratio))
  const handleReady = useEffectEvent(() => onReady?.())
  const isInteractive = useEffectEvent(() => interactive)

  useLayoutEffect(() => {
    const root = rootRef.current
    const stage = stageRef.current
    const slideEls = slideRefs.current.slice(0, slides.length).filter((el) => el !== null)
    if (!root || !stage || slideEls.length !== slides.length) return

    const quality = getQualityHint()
    const engine = new CarouselEngine({
      root,
      stage,
      slides: slideEls,
      inner: slideEls.map((el) => Array.from(el.querySelectorAll<HTMLElement>('[data-inner]'))),
      ambient: ambientRefs.current.slice(0, slides.length).filter((el) => el !== null),
      config: carouselConfig,
      initialIndex: carouselConfig.initialIndex,
      lowPower: quality.lowPower,
      qualityForced: quality.forced,
      onActiveChange: (index) => handleActive(index),
    })
    engine.init()
    engine.setEnabled(isInteractive())
    engineRef.current = engine

    // Preload: wait until every slide image is downloaded *and decoded* before the scene
    // is revealed, so no transition ever shows an empty or half-painted frame.
    let cancelled = false
    let loaded = 0
    const images = slideEls
      .map((el) => el.querySelector<HTMLImageElement>('[data-frame] img'))
      .filter((img) => img !== null)
    const decoded = Promise.all(
      images.map((img) =>
        img
          .decode()
          .catch(() => undefined)
          .then(() => {
            if (!cancelled) handleProgress(++loaded / images.length)
          }),
      ),
    )
    const timeout = new Promise((resolve) => window.setTimeout(resolve, IMAGE_TIMEOUT))
    void Promise.race([decoded, timeout]).then(() => {
      if (cancelled) return
      engine.playIntro()
      handleReady()
    })

    return () => {
      cancelled = true
      engine.destroy()
      engineRef.current = null
    }
  }, [slides])

  useEffect(() => {
    engineRef.current?.setEnabled(interactive)
  }, [interactive])

  useImperativeHandle(
    ref,
    () => ({
      goTo: (index) => engineRef.current?.goTo(index),
      next: () => engineRef.current?.next(),
      prev: () => engineRef.current?.prev(),
    }),
    [],
  )

  return (
    <section ref={rootRef} className="hc" aria-roledescription="carousel" aria-label="Villa Nest services">
      <div className="hc-atmosphere" aria-hidden="true">
        <div className="hc-ambient" data-atmosphere>
          {slides.map((slide, i) => (
            <div
              key={slide.id}
              ref={(el) => {
                ambientRefs.current[i] = el
              }}
              className="hc-ambient__layer"
              style={{ backgroundImage: `url("${slide.image.ambient}")` }}
            />
          ))}
        </div>
        <div className="hc-light" data-atmosphere />
        <div className="hc-floor" data-atmosphere />
      </div>

      <div ref={stageRef} className="hc-stage">
        {slides.map((slide, i) => (
          <div
            key={slide.id}
            ref={(el) => {
              slideRefs.current[i] = el
            }}
            className="hc-slide"
            data-slide-index={i}
            role="group"
            aria-roledescription="slide"
            aria-label={`${slide.title} (${i + 1} / ${slides.length})`}
          >
            <div className="hc-slide__reveal" data-reveal>
              <div className="hc-slide__frame" data-frame>
                <div className="hc-slide__inner" data-inner>
                  <SlideImage slide={slide} priority={i === carouselConfig.initialIndex} />
                </div>
              </div>
              <div className="hc-slide__reflection" aria-hidden="true">
                <div className="hc-slide__mirror">
                  <div className="hc-slide__inner" data-inner>
                    <SlideImage slide={slide} decorative />
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="hc-overlay" aria-hidden="true">
        <div className="hc-vignette" />
        <div className="hc-grain" />
      </div>

      <button
        type="button"
        className="hc-arrow hc-arrow--prev"
        aria-label="Previous space"
        onClick={() => engineRef.current?.prev()}
      >
        <Chevron direction="left" />
      </button>
      <button
        type="button"
        className="hc-arrow hc-arrow--next"
        aria-label="Next space"
        onClick={() => engineRef.current?.next()}
      >
        <Chevron direction="right" />
      </button>

      <nav className="hc-nav" aria-label="Services">
        <ul className="hc-nav__list">
          {slides.map((slide, i) => (
            <li key={slide.id}>
              <button
                type="button"
                className="hc-nav__item"
                aria-current={i === active ? 'true' : undefined}
                onClick={() => engineRef.current?.goTo(i)}
              >
                <span className="hc-nav__dot" aria-hidden="true" />
                <span className="hc-nav__label">{slide.label}</span>
              </button>
            </li>
          ))}
        </ul>
      </nav>

      <p className="visually-hidden" aria-live="polite">
        {slides[active]?.title}
      </p>
    </section>
  )
}
