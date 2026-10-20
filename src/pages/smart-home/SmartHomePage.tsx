import { useCallback, useEffect, useRef, useState } from 'react'
import { getSound, useSoundOn } from '../../audio/sound'
import { useApplianceBeep } from '../../audio/useApplianceBeep'
import { Header } from '../../components/Header'
import { useI18n } from '../../i18n/context'
import { Cta, DeckControls, DeckCopy, DeckNav, DeckStory, PageStrip, PlayButton } from '../shared/Deck'
import { useDeck } from '../shared/useDeck'
import { useDemo } from '../shared/useDemo'
import { revealBelowHeader } from '../shared/reveal'
import { usePageChrome } from '../shared/usePageChrome'
import { pageCopy, type SceneId, type ThemeId } from './content'
import { HeroVisual } from './HeroVisual'
import { ProtocolIcon } from './icons'
import { ScenePanel, type PanelView } from './ScenePanel'
import { usePageHome, type PageDevice } from './usePageHome'
import '../shared/page.css'
import './SmartHomePage.css'

/** The four themes, in order… */
const THEMES: ThemeId[] = ['scenes', 'security', 'energy', 'open']
/** …the panel's screen for each… */
const VIEW_OF: PanelView[] = ['home', 'security', 'energy', 'settings']
/** …and the theme each screen of its side menu belongs to. */
const THEME_OF: Record<PanelView, number> = { home: 0, scenes: 0, security: 1, energy: 2, settings: 3 }
/** The order of the side menu (a new screen slides in from its side). */
const MENU: PanelView[] = ['home', 'scenes', 'energy', 'security', 'settings']
/** The living-scene demo: coming home, unwinding, good night. */
const STEPS: SceneId[] = ['home', 'relax', 'sleep']
const STEP_MS = 3800
/** How long the "try it" hint stays after the call to action. */
const HINT_MS = 3600

/**
 * The Smart Home page (opened from "Explore" on the Smart Home space of the home page): the
 * standards it is built on, and the wall panel — live, as on the home page — whose four
 * themes change like the home page's spaces. On a computer it is one screen; on a phone the
 * living scene, once played, is told step by step under the photo.
 */
export function SmartHomePage() {
  const { lang } = useI18n()
  const copy = pageCopy[lang]
  const rootRef = useRef<HTMLDivElement>(null)
  const heroRef = useRef<HTMLElement>(null)
  const copyRef = useRef<HTMLDivElement>(null)
  const visualRef = useRef<HTMLDivElement>(null)
  const { ready, scrolled } = usePageChrome(rootRef, copy.description)
  const soundOn = useSoundOn()
  const { home, toggle, setLevel, setTemp, toggleArmed, applyScene, reset } = usePageHome()
  // The air-con beeps when it takes a command, from the panel or from a scene.
  useApplianceBeep(home.ac.on, home.ac.temp)

  const [view, setView] = useState<PanelView>('home')
  const [viewDir, setViewDir] = useState<1 | -1>(1)
  const onThemeChange = useCallback((index: number, direction: 1 | -1) => {
    setView(VIEW_OF[index])
    setViewDir(direction)
    getSound().whoosh(direction)
  }, [])
  const deck = useDeck(THEMES.length, { heroRef, onChange: onThemeChange })
  const { active, show, portrait } = deck

  const onStep = useCallback(
    (i: number) => {
      applyScene(STEPS[i])
      getSound().whoosh()
    },
    [applyScene],
  )
  const onEnd = useCallback(() => {
    reset()
    getSound().whoosh(-1)
  }, [reset])
  const demo = useDemo(STEPS.length, STEP_MS, onStep, onEnd)
  const { stop: stopDemo } = demo
  const playing = demo.step !== null

  // Phones: the story opens under the photo with the first play, for the living scenes.
  const [storyOpen, setStoryOpen] = useState(false)
  // "Explore": the panel lights up and a hint says it can be used.
  const [invite, setInvite] = useState(0)
  const [hint, setHint] = useState(false)
  useEffect(() => {
    if (!hint) return
    const id = window.setTimeout(() => setHint(false), HINT_MS)
    return () => window.clearTimeout(id)
  }, [hint, invite])

  const reveal = () => {
    if (portrait) revealBelowHeader(visualRef.current)
  }

  /** A screen of the panel's side menu: its theme comes with it. */
  const navigate = (screen: PanelView) => {
    const theme = THEME_OF[screen]
    if (theme !== active) show(theme)
    else setViewDir(MENU.indexOf(screen) >= MENU.indexOf(view) ? 1 : -1)
    setView(screen)
  }

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
      getSound().whoosh()
    },
    onToggleArmed: () => {
      stopDemo()
      toggleArmed()
    },
    onNavigate: navigate,
  }

  const playDemo = () => {
    if (active !== 0) show(0)
    setView('home')
    setStoryOpen(true)
    setHint(false)
    demo.play()
    reveal()
  }
  const explore = () => {
    navigate(VIEW_OF[active])
    setInvite((n) => n + 1)
    if (!playing) setHint(true)
    reveal()
  }
  const chooseStep = (i: number) => {
    stopDemo()
    panelActions.onScene(STEPS[i])
  }

  const scene = demo.step !== null ? copy.scenes[STEPS[demo.step]] : null
  const chosen = home.mode ? STEPS.indexOf(home.mode) : null

  return (
    <div ref={rootRef} className="app pg shp" data-ready={ready} data-scrolled={scrolled || undefined}>
      <Header soundOn={soundOn} onToggleSound={() => getSound().setOn(!soundOn)} homeHref="../" />
      <main>
        <section ref={heroRef} className="pg-hero" aria-roledescription="carousel" aria-labelledby="pg-title">
          <PageStrip
            label={copy.protocolsLabel}
            items={copy.protocols.map(({ name, note }, i) => ({ icon: <ProtocolIcon index={i} />, name, note }))}
          />

          <div className="pg-stage" {...deck.swipe}>
            <HeroVisual
              visualRef={visualRef}
              home={home}
              copyRef={copyRef}
              visible={deck.onScreen}
              invite={invite}
              alt={copy.panel.label}
              overlay={<DeckControls active={active} count={THEMES.length} onPrev={() => show(active - 1)} onNext={() => show(active + 1)} />}
            >
              <ScenePanel
                home={home}
                copy={copy.panel}
                scenes={copy.scenes}
                view={view}
                dir={viewDir}
                clock={scene?.time}
                {...panelActions}
              />
            </HeroVisual>

            <DeckCopy
              copyRef={copyRef}
              active={active}
              ready={ready}
              titleId="pg-title"
              titles={THEMES.map((id) => copy.features[id].title)}
              texts={THEMES.map((id) => copy.themes[id])}
              actions={(shown) => (
                <>
                  <Cta label={copy.themes[THEMES[shown]].cta} onClick={explore} />
                  <PlayButton playing={playing} watch={copy.watch} stop={copy.stop} onPlay={playDemo} onStop={stopDemo} />
                </>
              )}
            />

            <p className="pg-toast" role="status" data-on={scene !== null || hint || undefined}>
              {scene ? (
                <>
                  <b>
                    {scene.time} · {scene.name}
                  </b>
                  {scene.does}
                </>
              ) : (
                hint && <b>{copy.tryIt}</b>
              )}
            </p>

            <DeckStory
              open={storyOpen && active === 0}
              title={copy.story.title}
              steps={STEPS.map((id) => copy.scenes[id])}
              playing={demo.step}
              chosen={chosen}
              stepMs={STEP_MS}
              onStep={chooseStep}
              onPlay={playDemo}
              onStop={stopDemo}
              replay={copy.story.replay}
              stop={copy.stop}
            />
          </div>

          <DeckNav label={copy.index} items={THEMES.map((id) => copy.features[id])} active={active} onSelect={show} />

          <p className="visually-hidden" aria-live="polite">
            {copy.features[THEMES[active]].title}
          </p>
        </section>
      </main>
    </div>
  )
}
