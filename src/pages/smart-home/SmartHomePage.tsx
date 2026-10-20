import { useCallback, useEffect, useRef, useState, type CSSProperties, type PointerEvent, type RefObject } from 'react'
import { readSoundOn, TransitionSound } from '../../audio/TransitionSound'
import { Header } from '../../components/Header'
import media from '../../data/media.json'
import { useI18n } from '../../i18n/context'
import { pageCopy, type SceneId, type SectionId } from './content'
import { HeroVisual } from './HeroVisual'
import { PlayIcon, ProtocolIcon, StopIcon } from './icons'
import { ScenePanel, type PanelView } from './ScenePanel'
import { Sections } from './Sections'
import { ThemeCopy } from './ThemeCopy'
import { usePageHome, useSceneDemo, type PageDevice } from './usePageHome'
import './SmartHomePage.css'

/** The four themes of the hero, in order; each also has a section further down. */
const THEMES: SectionId[] = ['scenes', 'security', 'energy', 'open']
/** The panel's screen for each theme… */
const VIEW_OF: PanelView[] = ['home', 'security', 'energy', 'settings']
/** …and the theme each screen of its side menu belongs to. */
const THEME_OF: Record<PanelView, number> = { home: 0, scenes: 0, security: 1, energy: 2, settings: 3 }
const YEAR = new Date().getFullYear()
const PHOTO = `../${media.pages.publicPath}/smart-home-1280.webp`
const pad = (n: number) => String(n).padStart(2, '0')
/** A horizontal drag this long (px) moves to the next / previous theme. */
const SWIPE = 48

/** True while `ref` is on screen. */
function useOnScreen(ref: RefObject<HTMLElement | null>) {
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

function Arrow({ direction }: { direction: 'left' | 'right' }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d={direction === 'left' ? 'M19 12H5M11 6l-6 6 6 6' : 'M5 12h14M13 6l6 6-6 6'} />
    </svg>
  )
}

/**
 * The Smart Home page (opened from "Explore" on the Smart Home space of the home page): the
 * standards it is built on, then a hero with the wall panel — live, as on the home page —
 * whose four themes change like the home page's spaces (click, swipe, arrow keys), each
 * with its own section further down.
 */
export function SmartHomePage() {
  const { lang, t } = useI18n()
  const copy = pageCopy[lang]
  const rootRef = useRef<HTMLDivElement>(null)
  const heroRef = useRef<HTMLElement>(null)
  const copyRef = useRef<HTMLDivElement>(null)
  const heroOnScreen = useOnScreen(heroRef)
  const soundRef = useRef<TransitionSound | null>(null)
  const [soundOn, setSoundOn] = useState(readSoundOn)
  const { home, toggle, setLevel, setTemp, toggleArmed, applyScene, reset } = usePageHome()
  const [active, setActive] = useState(0)
  const [view, setView] = useState<PanelView>('home')
  const [dir, setDir] = useState<1 | -1>(1)
  const [scrolled, setScrolled] = useState(false)
  // The header comes in as on the home page once the page is shown.
  const [ready, setReady] = useState(false)
  useEffect(() => {
    const id = requestAnimationFrame(() => setReady(true))
    return () => cancelAnimationFrame(id)
  }, [])

  useEffect(() => {
    const sound = new TransitionSound()
    soundRef.current = sound
    return () => {
      sound.dispose()
      soundRef.current = null
    }
  }, [])

  useEffect(() => {
    document.querySelector('meta[name="description"]')?.setAttribute('content', copy.description)
  }, [copy])

  // The header stays in place while the page scrolls; it gets a backdrop once there is
  // content under it. The page starts below it (its height follows the viewport).
  useEffect(() => {
    const header = document.querySelector<HTMLElement>('.site-header')
    const root = rootRef.current
    if (!header || !root) return
    const observer = new ResizeObserver(() => root.style.setProperty('--shp-header-h', `${header.offsetHeight}px`))
    observer.observe(header)
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      observer.disconnect()
      window.removeEventListener('scroll', onScroll)
    }
  }, [])

  const whoosh = useCallback((direction: 1 | -1 = 1) => soundRef.current?.play(direction), [])
  const demo = useSceneDemo(applyScene, reset, whoosh)
  const { stop: stopDemo } = demo

  /** Theme `index` (wrapping round, like the home page), showing panel screen `screen`. */
  const show = useCallback(
    (index: number, screen?: PanelView) => {
      const next = (index + THEMES.length) % THEMES.length
      const target = screen ?? VIEW_OF[next]
      if (next === active && target === view) return
      const forward = next === active ? 1 : ((next - active + THEMES.length) % THEMES.length <= 2 ? 1 : -1)
      setDir(forward)
      setActive(next)
      setView(target)
      if (next !== active) whoosh(forward)
    },
    [active, view, whoosh],
  )

  // Arrow keys, as on the home page (not while a slider or a field has the focus).
  useEffect(() => {
    if (!heroOnScreen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return
      if ((e.target as HTMLElement).closest('input, textarea, select, [contenteditable]')) return
      if (e.key === 'ArrowRight') show(active + 1)
      else if (e.key === 'ArrowLeft') show(active - 1)
      else return
      e.preventDefault()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [heroOnScreen, active, show])

  // Swipe / drag sideways over the hero (not on the panel, the buttons or the links).
  const drag = useRef<{ id: number; x: number; y: number } | null>(null)
  const onPointerDown = (e: PointerEvent) => {
    if (e.button !== 0 || (e.target as HTMLElement).closest('button, a, input, [data-no-drag]')) return
    drag.current = { id: e.pointerId, x: e.clientX, y: e.clientY }
    e.currentTarget.setPointerCapture(e.pointerId)
  }
  const onPointerUp = (e: PointerEvent) => {
    const start = drag.current
    drag.current = null
    if (!start || start.id !== e.pointerId) return
    const dx = e.clientX - start.x
    const dy = e.clientY - start.y
    if (Math.abs(dx) >= SWIPE && Math.abs(dx) > Math.abs(dy) * 1.2) show(active + (dx < 0 ? 1 : -1))
  }

  const toggleSound = useCallback(() => {
    const sound = soundRef.current
    if (!sound) return
    sound.setOn(!sound.isOn)
    setSoundOn(sound.isOn)
  }, [])

  // Any change by hand on the panel ends the demo.
  const panelActions = {
    onToggle: (key: PageDevice) => {
      stopDemo()
      toggle(key)
    },
    onSetLevel: (key: 'lights' | 'curtain', level: number) => {
      stopDemo()
      setLevel(key, level)
    },
    onSetTemp: (temp: number) => {
      stopDemo()
      setTemp(temp)
    },
    onScene: (scene: SceneId) => {
      stopDemo()
      applyScene(scene)
      whoosh()
    },
    onToggleArmed: () => {
      stopDemo()
      toggleArmed()
    },
    onNavigate: (screen: PanelView) => show(THEME_OF[screen], screen),
  }
  /** The living-scene demo plays on the panel's home screen. */
  const playDemo = () => {
    show(0, 'home')
    demo.play()
  }
  /** A scene chosen further down the page plays in the hero, so it scrolls back up to it. */
  const showScene = (scene: SceneId) => {
    stopDemo()
    applyScene(scene)
    whoosh()
    show(0, 'home')
    heroRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const scene = demo.scene ?? home.mode
  const playing = demo.scene !== null

  return (
    <div ref={rootRef} className="app shp" id="top" data-ready={ready} data-scrolled={scrolled || undefined}>
      <Header soundOn={soundOn} onToggleSound={toggleSound} homeHref="../" />
      <main>
        <section
          ref={heroRef}
          className="shp-hero"
          aria-roledescription="carousel"
          aria-labelledby="shp-title"
          style={{ '--hc-nav-count': THEMES.length } as CSSProperties}
        >
          <ul className="shp-protocols">
            {copy.protocols.map(({ name, note }, i) => (
              <li key={name}>
                <ProtocolIcon index={i} className="shp-protocols__icon" />
                <span>
                  <b>{name}</b>
                  <small>{note}</small>
                </span>
              </li>
            ))}
          </ul>

          <div className="shp-stage" onPointerDown={onPointerDown} onPointerUp={onPointerUp} onPointerCancel={() => (drag.current = null)}>
            <HeroVisual
              home={home}
              copyRef={copyRef}
              visible={heroOnScreen}
              alt={copy.panel.label}
              overlay={
                <div className="hc-controls shp-controls">
                  <button type="button" className="hc-controls__btn" aria-label={t.prev} onClick={() => show(active - 1)}>
                    <Arrow direction="left" />
                  </button>
                  <p className="hc-controls__count" aria-hidden="true">
                    <span>{pad(active + 1)}</span>
                    <i />
                    <span>{pad(THEMES.length)}</span>
                  </p>
                  <button type="button" className="hc-controls__btn" aria-label={t.next} onClick={() => show(active + 1)}>
                    <Arrow direction="right" />
                  </button>
                </div>
              }
            >
              <ScenePanel
                home={home}
                copy={copy.panel}
                scenes={copy.scenes}
                view={view}
                dir={dir}
                photo={PHOTO}
                clock={demo.scene ? copy.scenes[demo.scene].time : undefined}
                {...panelActions}
              />
            </HeroVisual>

            <ThemeCopy
              copy={copy}
              themes={THEMES}
              active={active}
              ready={ready}
              copyRef={copyRef}
              extra={
                <button type="button" className="shp-play" aria-pressed={playing} onClick={playing ? demo.stop : playDemo}>
                  <span className="shp-play__icon">{playing ? <StopIcon /> : <PlayIcon />}</span>
                  {playing ? copy.stop : copy.watch}
                </button>
              }
            />

            <p className="shp-toast" role="status" data-on={playing || undefined}>
              {demo.scene && (
                <>
                  <b>
                    {copy.scenes[demo.scene].time} · {copy.scenes[demo.scene].name}
                  </b>
                  {copy.scenes[demo.scene].does}
                </>
              )}
            </p>
          </div>

          <nav className="hc-nav shp-nav" aria-label={copy.index}>
            <ul className="hc-nav__list">
              {THEMES.map((id, i) => (
                <li key={id}>
                  <button type="button" className="hc-nav__item" aria-current={i === active ? 'true' : undefined} onClick={() => show(i)}>
                    <span className="hc-nav__index">{pad(i + 1)}</span>
                    <span className="hc-nav__title">{copy.features[id].title}</span>
                    <span className="hc-nav__subtitle">{copy.features[id].note}</span>
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
            {copy.features[THEMES[active]].title}
          </p>
        </section>

        <Sections copy={copy} scene={scene} armed={home.armed} onScene={showScene} onToggleArmed={toggleArmed} />
      </main>

      <footer className="shp-footer">
        <span>© {YEAR} VILLA NEST</span>
        <a href="../">{copy.back}</a>
      </footer>
    </div>
  )
}
