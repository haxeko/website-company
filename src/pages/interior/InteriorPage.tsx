import { useCallback, useRef, useState, type CSSProperties, type KeyboardEvent } from 'react'
import { getSound, useSoundOn } from '../../audio/sound'
import { Header } from '../../components/Header'
import { useI18n } from '../../i18n/context'
import { Cta, DeckControls, DeckCopy, DeckNav, DeckStory, PageStrip, PlayButton } from '../shared/Deck'
import { revealBelowHeader } from '../shared/reveal'
import { useDeck } from '../shared/useDeck'
import { useDemo } from '../shared/useDemo'
import { usePageChrome } from '../shared/usePageChrome'
import { interiorCopy, MOODS, type FacetId, type MoodId } from './content'
import { RoomVisual, Swatch } from './RoomVisual'
import '../shared/page.css'
import './InteriorPage.css'

/** The four facets of the interior, in order: the page's themes. */
const FACETS: FacetId[] = ['space', 'materials', 'light', 'bespoke']
const LIGHT = FACETS.indexOf('light')
const STEP_MS = 3800

const SunIcon = ({ mood }: { mood: MoodId }) => (
  <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
    {mood === 'morning' && <path d="M12 4v2M5.6 6.6 7 8M18.4 6.6 17 8M4 15h16M7.5 15a4.5 4.5 0 0 1 9 0M8 19h8" />}
    {mood === 'golden' && <path d="M4 16h16M8 16a4 4 0 0 1 8 0M12 8V6M6.3 10.3 5 9M17.7 10.3 19 9M7 20h10" />}
    {mood === 'evening' && <path d="M15.5 4.5a7.5 7.5 0 1 0 4 12.3A6.5 6.5 0 0 1 15.5 4.5z" />}
  </svg>
)

/**
 * The Interior page (opened from "Explore" on the Interior space of the home page): the living
 * room with its materials, its light through the day and its made-to-measure pieces — four
 * facets that change like the home page's spaces. "Watch a day at home" plays the light
 * from morning to evening.
 */
export function InteriorPage() {
  const { lang } = useI18n()
  const copy = interiorCopy[lang]
  const rootRef = useRef<HTMLDivElement>(null)
  const heroRef = useRef<HTMLElement>(null)
  const copyRef = useRef<HTMLDivElement>(null)
  const visualRef = useRef<HTMLDivElement>(null)
  const { ready, scrolled } = usePageChrome(rootRef, copy.description)
  const soundOn = useSoundOn()

  const deck = useDeck(FACETS.length, { heroRef })
  const { active, show, portrait } = deck

  const [mood, setMood] = useState<MoodId>('golden')
  // (also read by the demo's timer)
  const moodRef = useRef<MoodId>('golden')
  const [selected, setSelected] = useState(0)
  const [walk, setWalk] = useState(0)
  const [redraw, setRedraw] = useState(0)
  const changeMood = useCallback((next: MoodId) => {
    moodRef.current = next
    setMood(next)
  }, [])

  const onStep = useCallback(
    (i: number) => {
      show(LIGHT)
      changeMood(MOODS[i])
    },
    [show, changeMood],
  )
  const onEnd = useCallback(() => changeMood('golden'), [changeMood])
  const demo = useDemo(MOODS.length, STEP_MS, onStep, onEnd)
  const playing = demo.step !== null
  const [storyOpen, setStoryOpen] = useState(false)

  const reveal = () => {
    if (portrait) revealBelowHeader(visualRef.current)
  }
  /** Each facet's call to action does what the facet is about. */
  const explore = () => {
    demo.stop()
    const facet = FACETS[active]
    if (facet === 'space') setWalk((n) => n + 1)
    else if (facet === 'materials') setSelected((n) => (n + 1) % copy.materials.length)
    else if (facet === 'light') changeMood(MOODS[(MOODS.indexOf(mood) + 1) % MOODS.length])
    else setRedraw((n) => n + 1)
    reveal()
  }
  const playDemo = () => {
    setStoryOpen(true)
    demo.play()
    reveal()
  }
  const chooseMood = (next: MoodId) => {
    demo.stop()
    changeMood(next)
  }
  // The light switch is a set of options: the arrow keys move along it (and its focus).
  const onMoodKey = (e: KeyboardEvent<HTMLDivElement>) => {
    const step = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 0
    if (!step) return
    e.preventDefault()
    const next = (MOODS.indexOf(mood) + step + MOODS.length) % MOODS.length
    chooseMood(MOODS[next])
    e.currentTarget.querySelectorAll<HTMLButtonElement>('button')[next]?.focus()
  }

  const material = copy.materials[selected]

  return (
    <div ref={rootRef} className="app pg ip" data-ready={ready} data-scrolled={scrolled || undefined}>
      <Header soundOn={soundOn} onToggleSound={() => getSound().setOn(!soundOn)} homeHref="../" />
      <main>
        <section ref={heroRef} className="pg-hero" aria-roledescription="carousel" aria-labelledby="pg-title">
          <PageStrip
            label={copy.stripLabel}
            items={copy.materials.map(({ name, origin }, i) => ({ icon: <Swatch index={i} className="ip-swatch" />, name, note: origin }))}
          />

          <div className="pg-stage">
            <RoomVisual
              visualRef={visualRef}
              copy={copy}
              facet={active}
              mood={mood}
              selected={selected}
              onSelect={setSelected}
              walk={walk}
              redraw={redraw}
              alt={copy.themes.space.description}
              overlay={
                <DeckControls active={active} count={FACETS.length} onPrev={() => show(active - 1)} onNext={() => show(active + 1)} />
              }
            />

            <DeckCopy
              copyRef={copyRef}
              active={active}
              ready={ready}
              titleId="pg-title"
              titles={FACETS.map((id) => copy.features[id].title)}
              texts={FACETS.map((id) => copy.themes[id])}
              actions={(shown) => (
                <>
                  <Cta label={copy.themes[FACETS[shown]].cta} onClick={explore} />
                  <PlayButton playing={playing} watch={copy.watch} stop={copy.stop} onPlay={playDemo} onStop={demo.stop} />
                </>
              )}
            />

            <aside className="ip-card" data-on={(active === 1 && !storyOpen) || undefined} aria-hidden={active !== 1} aria-live="polite">
              <Swatch index={selected} className="ip-card__swatch" />
              <div>
                <p className="ip-card__origin">{material.origin}</p>
                <p className="ip-card__name">{material.name}</p>
                <p className="ip-card__note">{material.note}</p>
              </div>
              <p className="ip-card__count" aria-hidden="true">
                {String(selected + 1).padStart(2, '0')} / {String(copy.materials.length).padStart(2, '0')}
              </p>
            </aside>

            <div
              className="ip-moods"
              role="radiogroup"
              aria-label={copy.moodLabel}
              data-on={(active === LIGHT && !storyOpen) || undefined}
              aria-hidden={active !== LIGHT}
              style={{ '--ip-mood': MOODS.indexOf(mood) } as CSSProperties}
              onKeyDown={onMoodKey}
            >
              <i className="ip-moods__thumb" aria-hidden="true" />
              {MOODS.map((m) => (
                <button
                  key={m}
                  type="button"
                  role="radio"
                  aria-checked={m === mood}
                  tabIndex={active === LIGHT && m === mood ? 0 : -1}
                  onClick={() => chooseMood(m)}
                >
                  <SunIcon mood={m} />
                  <span>{copy.moods[m].label}</span>
                  <small>{copy.moods[m].time}</small>
                </button>
              ))}
            </div>

            <DeckStory
              open={storyOpen}
              title={copy.story.title}
              steps={MOODS.map((m) => copy.moods[m])}
              playing={demo.step}
              chosen={playing ? null : MOODS.indexOf(mood)}
              stepMs={STEP_MS}
              onStep={(i) => {
                show(LIGHT)
                chooseMood(MOODS[i])
              }}
              onPlay={playDemo}
              onStop={demo.stop}
              replay={copy.story.replay}
              stop={copy.stop}
            />
          </div>

          <DeckNav label={copy.index} items={FACETS.map((id) => copy.features[id])} active={active} onSelect={show} />

          <p className="visually-hidden" aria-live="polite">
            {copy.features[FACETS[active]].title}
          </p>
        </section>
      </main>
    </div>
  )
}
