import { useCallback, useEffect, useRef, useState, type RefObject } from 'react'
import { readSoundOn, TransitionSound } from '../../audio/TransitionSound'
import { Header } from '../../components/Header'
import { useI18n } from '../../i18n/context'
import { pageCopy, type SceneId, type SectionId } from './content'
import { HeroVisual } from './HeroVisual'
import { ArrowIcon, PlayIcon, ProtocolIcon, StopIcon } from './icons'
import { ScenePanel } from './ScenePanel'
import { Sections } from './Sections'
import { usePageHome, useSceneDemo, type PageDevice } from './usePageHome'
import './SmartHomePage.css'

const FEATURES: SectionId[] = ['scenes', 'security', 'energy', 'open']
const YEAR = new Date().getFullYear()

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

/**
 * The Smart Home page (opened from "Explore" on the Smart Home space of the home page): the
 * standards it is built on, a hero with the wall panel — live, as on the home page — and the
 * four themes, each with its own section further down.
 */
export function SmartHomePage() {
  const { lang } = useI18n()
  const copy = pageCopy[lang]
  const heroRef = useRef<HTMLElement>(null)
  const copyRef = useRef<HTMLDivElement>(null)
  const heroOnScreen = useOnScreen(heroRef)
  const soundRef = useRef<TransitionSound | null>(null)
  const [soundOn, setSoundOn] = useState(readSoundOn)
  const { home, toggle, setLevel, setTemp, toggleArmed, applyScene, reset } = usePageHome()
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

  // The hero starts below the header (its height follows the viewport).
  useEffect(() => {
    const header = document.querySelector<HTMLElement>('.site-header')
    const hero = heroRef.current
    if (!header || !hero) return
    const observer = new ResizeObserver(() => hero.style.setProperty('--shp-header-h', `${header.offsetHeight}px`))
    observer.observe(header)
    return () => observer.disconnect()
  }, [])

  const whoosh = useCallback(() => soundRef.current?.play(1), [])
  const demo = useSceneDemo(applyScene, reset, whoosh)

  const toggleSound = useCallback(() => {
    const sound = soundRef.current
    if (!sound) return
    sound.setOn(!sound.isOn)
    setSoundOn(sound.isOn)
  }, [])

  // Any change by hand on the panel ends the demo.
  const { stop: stopDemo } = demo
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
  }
  /** A scene chosen further down the page plays in the hero, so it scrolls back up to it. */
  const showScene = (scene: SceneId) => {
    stopDemo()
    applyScene(scene)
    whoosh()
    heroRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const scene = demo.scene ?? home.mode
  const playing = demo.scene !== null

  return (
    <div className="app shp" id="top" data-ready={ready}>
      <Header soundOn={soundOn} onToggleSound={toggleSound} homeHref="../" />
      <main>
        <section ref={heroRef} className="shp-hero" aria-labelledby="shp-title">
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

          <div className="shp-stage">
            <HeroVisual home={home} copyRef={copyRef} visible={heroOnScreen} alt={copy.panel.label}>
              <ScenePanel
                home={home}
                copy={copy.panel}
                clock={demo.scene ? copy.scenes[demo.scene].time : undefined}
                {...panelActions}
              />
            </HeroVisual>

            <div ref={copyRef} className="shp-copy">
              <p className="shp-copy__index">
                <span>01</span>
                <i aria-hidden="true" />
                {copy.index}
              </p>
              <p className="shp-copy__kicker">{copy.kicker}</p>
              <h1 id="shp-title" className="shp-copy__headline">
                {copy.headline[0]} <br />
                {copy.headline[1]}
                <em>{copy.accent}</em>
              </h1>
              <p className="shp-copy__intro">{copy.intro}</p>
              <div className="shp-copy__actions">
                <a className="shp-button" href="#scenes">
                  {copy.explore}
                  <span className="shp-button__icon">
                    <ArrowIcon />
                  </span>
                </a>
                <i className="shp-copy__divider" aria-hidden="true" />
                <button type="button" className="shp-play" aria-pressed={playing} onClick={playing ? demo.stop : demo.play}>
                  <span className="shp-play__icon">{playing ? <StopIcon /> : <PlayIcon />}</span>
                  {playing ? copy.stop : copy.watch}
                </button>
              </div>
            </div>

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

          <nav className="shp-features" aria-label={copy.index}>
            {FEATURES.map((id, i) => (
              <a key={id} href={`#${id}`} data-on={i === 0 || undefined}>
                <span>{String(i + 1).padStart(2, '0')}</span>
                <b>{copy.features[id].title}</b>
                <small>{copy.features[id].note}</small>
              </a>
            ))}
          </nav>

          <a className="shp-scroll" href="#scenes">
            <span aria-hidden="true" />
            {copy.scroll}
          </a>
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
