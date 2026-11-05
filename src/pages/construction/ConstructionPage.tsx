import { useEffect, useRef, useState } from 'react'
import { getSound, useSoundOn } from '../../audio/sound'
import { Header } from '../../components/Header'
import { useI18n } from '../../i18n/context'
import { DeckControls, DeckCopy, DeckNav, PageStrip } from '../shared/Deck'
import { Projects, PROJECTS_MIN_ROOM } from '../shared/projects/Projects'
import { useDeck } from '../shared/useDeck'
import { usePageChrome } from '../shared/usePageChrome'
import { BuildVisual } from './BuildVisual'
import { constructionCopy, type PhaseId } from './content'
import { StripIcon } from './icons'
import '../shared/page.css'
import './ConstructionPage.css'

/** The four phases of the build, in order: the page's themes. */
const PHASES: PhaseId[] = ['design', 'structure', 'progress', 'handover']
/** The hint by the laser line: when it shows, a moment after the page opens, and for how long. */
const HINT_AT_MS = 2600
const HINT_MS = 4000

/**
 * The Construction page (opened from "Explore" on the Construction space of the home page):
 * the villa as BIM model and as building, divided by a laser line that can be dragged; the
 * four phases of the build — design, structure, progress, handover — change like the home
 * page's spaces. Under the text, the construction projects.
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

  const { active, show } = useDeck(PHASES.length, { heroRef })

  // A hint says the line can be dragged, a moment after the page opens.
  const [hint, setHint] = useState(false)
  useEffect(() => {
    const showHint = window.setTimeout(() => setHint(true), HINT_AT_MS)
    const hideHint = window.setTimeout(() => setHint(false), HINT_AT_MS + HINT_MS)
    return () => {
      window.clearTimeout(showHint)
      window.clearTimeout(hideHint)
    }
  }, [])

  return (
    <div ref={rootRef} className="app pg cp" data-ready={ready} data-scrolled={scrolled || undefined}>
      <Header soundOn={soundOn} onToggleSound={() => getSound().setOn(!soundOn)} homeHref="../" />
      <main>
        <section ref={heroRef} className="pg-hero" aria-roledescription="carousel" aria-labelledby="pg-title">
          <PageStrip
            label={copy.stripLabel}
            items={copy.strip.map(({ name, note }, i) => ({ icon: <StripIcon index={i} />, name, note }))}
          />

          <div className="pg-stage">
            <BuildVisual
              visualRef={visualRef}
              copy={copy}
              phase={active}
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
              below={(room) => <Projects category="construction" name={copy.name} ready={ready} room={room} />}
              belowMin={PROJECTS_MIN_ROOM}
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
