import { useRef, useState, type CSSProperties, type KeyboardEvent } from 'react'
import { getSound, useSoundOn } from '../../audio/sound'
import { Header } from '../../components/Header'
import { useI18n } from '../../i18n/context'
import { DeckControls, DeckCopy, DeckNav, PageStrip } from '../shared/Deck'
import { Projects, PROJECTS_MIN_ROOM } from '../shared/projects/Projects'
import { useDeck } from '../shared/useDeck'
import { usePageChrome } from '../shared/usePageChrome'
import { interiorCopy, MOODS, type FacetId, type MoodId } from './content'
import { RoomVisual, Swatch } from './RoomVisual'
import '../shared/page.css'
import './InteriorPage.css'

/** The four facets of the interior, in order: the page's themes. */
const FACETS: FacetId[] = ['space', 'materials', 'light', 'bespoke']
const LIGHT = FACETS.indexOf('light')

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
 * facets that change like the home page's spaces. Under the text, the interior projects.
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

  const { active, show } = useDeck(FACETS.length, { heroRef })

  const [mood, setMood] = useState<MoodId>('golden')
  const [selected, setSelected] = useState(0)
  const chooseMood = setMood
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
              below={(room) => <Projects category="interior" name={copy.name} ready={ready} room={room} />}
              belowMin={PROJECTS_MIN_ROOM}
            />

            <aside className="ip-card" data-on={active === 1 || undefined} aria-hidden={active !== 1} aria-live="polite">
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
              data-on={active === LIGHT || undefined}
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
