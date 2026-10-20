import {
  useCallback,
  useEffect,
  useEffectEvent,
  useImperativeHandle,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type Ref,
} from 'react'
import { carouselConfig } from '../../config/animation'
import type { Slide } from '../../data/slides'
import { useI18n } from '../../i18n/context'
import { getQualityHint } from '../../utils/device'
import {
  ControlScreen,
  Curtain,
  HomeSheet,
  HomeWall,
  SceneEffects,
  snowDensity,
  useHomeAtmosphere,
  useHomeState,
  windStrength,
} from '../SmartHome'
import { CarouselEngine } from './CarouselEngine'
import { HeroCopy } from './HeroCopy'
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
  /** Space shown in the centre on first load. */
  initialIndex?: number
  /** False while something covers the carousel: disables drag / wheel / keys. */
  interactive?: boolean
  onActiveChange?: (index: number) => void
  /** 0 → 1 while the slide images load and decode. */
  onLoadProgress?: (ratio: number) => void
  /** Called when the images are ready and the entrance animation starts. */
  onReady?: () => void
}

/** Never keep the visitor waiting longer than this for slow images. */
const IMAGE_TIMEOUT = 8000
/** Panels needed around the ring so both screen edges always show a neighbour. */
const MIN_RING_PANELS = 5

const pad = (n: number) => String(n).padStart(2, '0')

function Arrow({ direction }: { direction: 'left' | 'right' }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d={direction === 'left' ? 'M19 12H5m6-6-6 6 6 6' : 'M5 12h14m-6-6 6 6-6 6'} />
    </svg>
  )
}

export function HeroCarousel({
  slides,
  ref,
  initialIndex = carouselConfig.initialIndex,
  interactive = true,
  onActiveChange,
  onLoadProgress,
  onReady,
}: HeroCarouselProps) {
  const { lang, t } = useI18n()
  const rootRef = useRef<HTMLElement>(null)
  const stageRef = useRef<HTMLDivElement>(null)
  const slideRefs = useRef<(HTMLDivElement | null)[]>([])
  const ambientRefs = useRef<(HTMLDivElement | null)[]>([])
  const engineRef = useRef<CarouselEngine | null>(null)
  const [active, setActive] = useState(initialIndex)
  const [ready, setReady] = useState(false)
  const { home, toggle, setLevel, nudgeTemp } = useHomeState()
  useHomeAtmosphere(rootRef, home)
  const homeIndex = slides.findIndex((slide) => slide.screen)
  const homeInView = ready && active === homeIndex
  const [sheetOpen, setSheetOpen] = useState(false)
  const closeSheet = useCallback(() => setSheetOpen(false), [])
  const openSheet = useCallback(() => setSheetOpen(true), [])
  // With only three images each one is placed twice around the ring (panel k shows image
  // k % n): the panorama continues past both screen edges even while it rotates.
  const ring = useMemo(() => {
    const copies = Math.max(1, Math.ceil(MIN_RING_PANELS / slides.length))
    return Array.from({ length: slides.length * copies }, (_, k) => ({
      slide: slides[k % slides.length],
      index: k % slides.length,
      copy: Math.floor(k / slides.length),
    }))
  }, [slides])

  const handleActive = useEffectEvent((index: number) => {
    setActive(index)
    setSheetOpen(false)
    onActiveChange?.(index)
  })
  const handleProgress = useEffectEvent((ratio: number) => onLoadProgress?.(ratio))
  const handleReady = useEffectEvent(() => {
    setReady(true)
    onReady?.()
  })
  const isInteractive = useEffectEvent(() => interactive)
  const getInitialIndex = useEffectEvent(() => initialIndex)

  useLayoutEffect(() => {
    const root = rootRef.current
    const stage = stageRef.current
    const slideEls = slideRefs.current.slice(0, ring.length).filter((el) => el !== null)
    if (!root || !stage || slideEls.length !== ring.length) return

    const quality = getQualityHint()
    const engine = new CarouselEngine({
      root,
      stage,
      slides: slideEls,
      period: slides.length,
      ambient: ambientRefs.current.slice(0, slides.length).filter((el) => el !== null),
      config: carouselConfig,
      initialIndex: getInitialIndex(),
      lowPower: quality.lowPower,
      qualityForced: quality.forced,
      onActiveChange: (index) => handleActive(index),
    })
    engine.init()
    engine.setEnabled(isInteractive())
    engineRef.current = engine

    // Preload: wait until every image is downloaded *and decoded* before the scene is
    // revealed, so no transition ever shows an empty or half-painted frame.
    let cancelled = false
    let loaded = 0
    const images = slideEls
      .slice(0, slides.length)
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
  }, [slides, ring])

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
    <section
      ref={rootRef}
      className="hc"
      data-wind={home.fan.on || undefined}
      data-sheet={(sheetOpen && homeInView) || undefined}
      aria-roledescription="carousel"
      aria-label={t.carousel}
    >
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
        <div className="sh-room" data-on={homeInView || undefined}>
          <i />
        </div>
        <div className="hc-floor" data-atmosphere />
      </div>

      <div ref={stageRef} className="hc-stage">
        {ring.map(({ slide, index, copy }, k) => (
          <div
            key={`${slide.id}-${copy}`}
            ref={(el) => {
              slideRefs.current[k] = el
            }}
            className="hc-slide"
            data-slide-index={k}
            role="group"
            aria-roledescription="slide"
            aria-label={`${slide.copy[lang].title} (${index + 1} / ${slides.length})`}
          >
            <div className="hc-slide__reveal" data-reveal data-home={slide.screen ? true : undefined}>
              <div className="hc-slide__frame" data-frame>
                <SlideImage
                  slide={slide}
                  alt={slide.copy[lang].alt}
                  priority={copy === 0 && index === initialIndex}
                />
                {slide.screen && (
                  <HomeWall
                    rect={slide.screen}
                    home={home}
                    onToggle={toggle}
                    onSetLevel={setLevel}
                    onNudgeTemp={nudgeTemp}
                    onExpand={openSheet}
                  />
                )}
              </div>
              <div className="hc-slide__reflection" aria-hidden="true">
                <div className="hc-slide__mirror">
                  <SlideImage slide={slide} alt="" />
                  {slide.screen && <Curtain />}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="hc-overlay" aria-hidden="true">
        <div className="hc-vignette" />
        <div className="hc-scrim" />
        <div className="hc-grain" />
      </div>

      {homeIndex >= 0 && (
        <>
          <SceneEffects snow={snowDensity(home)} wind={windStrength(home)} visible={homeInView} />
          <HomeSheet open={sheetOpen && homeInView} onClose={closeSheet}>
            <ControlScreen
              variant="sheet"
              home={home}
              onToggle={toggle}
              onSetLevel={setLevel}
              onNudgeTemp={nudgeTemp}
            />
          </HomeSheet>
        </>
      )}

      <HeroCopy slides={slides} active={active} ready={ready} />

      <div className="hc-controls">
        <button type="button" className="hc-controls__btn" aria-label={t.prev} onClick={() => engineRef.current?.prev()}>
          <Arrow direction="left" />
        </button>
        <p className="hc-controls__count" aria-hidden="true">
          <span>{pad(active + 1)}</span>
          <i />
          <span>{pad(slides.length)}</span>
        </p>
        <button type="button" className="hc-controls__btn" aria-label={t.next} onClick={() => engineRef.current?.next()}>
          <Arrow direction="right" />
        </button>
      </div>

      <nav className="hc-nav" aria-label={t.services}>
        <ul className="hc-nav__list">
          {slides.map((slide, i) => (
            <li key={slide.id}>
              <button
                type="button"
                className="hc-nav__item"
                aria-current={i === active ? 'true' : undefined}
                onClick={() => engineRef.current?.goTo(i)}
              >
                <span className="hc-nav__index">{pad(i + 1)}</span>
                <span className="hc-nav__title">{slide.copy[lang].title}</span>
                <span className="hc-nav__subtitle">{slide.copy[lang].subtitle}</span>
              </button>
            </li>
          ))}
        </ul>
        <p className="hc-nav__hint" aria-hidden="true">
          <span className="hc-nav__mouse" />
          {t.hint}
        </p>
      </nav>

      <p className="visually-hidden" aria-live="polite">
        {slides[active]?.copy[lang].title}
      </p>
    </section>
  )
}
