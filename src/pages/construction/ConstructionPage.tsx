import { useCallback, useEffect, useRef, useState } from 'react'
import { getSound, useSoundOn } from '../../audio/sound'
import { Header } from '../../components/Header'
import { useI18n } from '../../i18n/context'
import { Cta, DeckControls, DeckCopy, DeckNav, DeckStory, PageStrip, PlayButton } from '../shared/Deck'
import { revealBelowHeader } from '../shared/reveal'
import { useDeck } from '../shared/useDeck'
import { useDemo } from '../shared/useDemo'
import { usePageChrome } from '../shared/usePageChrome'
import { BuildVisual } from './BuildVisual'
import { constructionCopy, type PhaseId } from './content'
import { StripIcon } from './icons'
import '../shared/page.css'
import './ConstructionPage.css'

/** The four phases of the build, in order: the page's themes. */
const PHASES: PhaseId[] = ['design', 'structure', 'progress', 'handover']
const STEP_MS = 4200
/** The hint by the laser line: how long it stays, when it first shows, and after a sweep. */
const HINT_MS = 4000
const FIRST_HINT_MS = 2600
const SWEEP_MS = 4300

/**
 * The Construction page (opened from "Explore" on the Construction space of the home page):
 * the villa as drawing and as building, divided by a laser line that can be dragged; the
 * four phases of the build — design, structure, progress, handover — change like the home
 * page's spaces. "Watch the build" walks through them, the line sweeping as the work goes.
 */
export function ConstructionPage() {
  const { lang } = useI18n()
  const copy = constructionCopy[lang]
  const rootRef = useRef<HTMLDivElement>(null)
  const heroRef = useRef<HTMLElement>(null)
  const copyRef = useRef<HTMLDivElement>(null)
  const visualRef = useRef<HTMLDivElement>(null)
  const { ready, scrolled } = usePageChrome(rootRef, copy.description)
  const soundOn = useSoundOn()

  const onPhaseChange = useCallback((_: number, direction: 1 | -1) => getSound().whoosh(direction), [])
  const deck = useDeck(PHASES.length, { heroRef, onChange: onPhaseChange })
  const { active, show, portrait } = deck
  const demo = useDemo(PHASES.length, STEP_MS, show)
  const playing = demo.step !== null

  // Phones: the story opens under the photo with the first play.
  const [storyOpen, setStoryOpen] = useState(false)
  // "Explore": the line sweeps across once, then a hint says it can be dragged — as it does
  // once, a moment after the page opens.
  const [sweep, setSweep] = useState(0)
  const [hint, setHint] = useState(false)
  useEffect(() => {
    const delay = sweep ? SWEEP_MS : FIRST_HINT_MS
    const showHint = window.setTimeout(() => setHint(true), delay)
    const hideHint = window.setTimeout(() => setHint(false), delay + HINT_MS)
    return () => {
      window.clearTimeout(showHint)
      window.clearTimeout(hideHint)
    }
  }, [sweep])

  const reveal = () => {
    if (portrait) revealBelowHeader(visualRef.current)
  }
  const explore = () => {
    demo.stop()
    setHint(false)
    setSweep((n) => n + 1)
    reveal()
  }
  const playDemo = () => {
    setStoryOpen(true)
    setHint(false)
    demo.play()
    reveal()
  }
  const chooseStep = (i: number) => {
    demo.stop()
    show(i)
  }

  return (
    <div ref={rootRef} className="app pg cp" data-ready={ready} data-scrolled={scrolled || undefined}>
      <Header soundOn={soundOn} onToggleSound={() => getSound().setOn(!soundOn)} homeHref="../" />
      <main>
        <section ref={heroRef} className="pg-hero" aria-roledescription="carousel" aria-labelledby="pg-title">
          <PageStrip
            label={copy.stripLabel}
            items={copy.strip.map(({ name, note }, i) => ({ icon: <StripIcon index={i} />, name, note }))}
          />

          <div className="pg-stage" {...deck.swipe}>
            <BuildVisual
              visualRef={visualRef}
              copy={copy}
              phase={active}
              sweep={sweep}
              storyOpen={storyOpen}
              hint={hint ? copy.tryIt : undefined}
              alt={copy.themes.design.kicker}
              overlay={
                <DeckControls active={active} count={PHASES.length} onPrev={() => show(active - 1)} onNext={() => show(active + 1)} />
              }
            />

            <DeckCopy
              copyRef={copyRef}
              active={active}
              ready={ready}
              titleId="pg-title"
              titles={PHASES.map((id) => copy.features[id].title)}
              texts={PHASES.map((id) => copy.themes[id])}
              actions={(shown) => (
                <>
                  <Cta label={copy.themes[PHASES[shown]].cta} onClick={explore} />
                  <PlayButton playing={playing} watch={copy.watch} stop={copy.stop} onPlay={playDemo} onStop={demo.stop} />
                </>
              )}
            />

            <DeckStory
              open={storyOpen}
              title={copy.story.title}
              steps={copy.story.steps}
              playing={demo.step}
              chosen={playing ? null : active}
              stepMs={STEP_MS}
              onStep={chooseStep}
              onPlay={playDemo}
              onStop={demo.stop}
              replay={copy.story.replay}
              stop={copy.stop}
            />
          </div>

          <DeckNav label={copy.index} items={PHASES.map((id) => copy.features[id])} active={active} onSelect={show} />

          <p className="visually-hidden" aria-live="polite">
            {copy.features[PHASES[active]].title}
          </p>
        </section>
      </main>
    </div>
  )
}
