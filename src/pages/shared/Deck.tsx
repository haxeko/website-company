import { Fragment, useLayoutEffect, useState, type CSSProperties, type ReactNode, type RefObject } from 'react'
import { MultiLine } from '../../components/HeroCarousel/HeroCopy'
import { useLineSwap } from '../../components/HeroCarousel/useLineSwap'
import '../../components/HeroCarousel/editorial.css'
import { useI18n } from '../../i18n/context'
import { CtaArrow, PlayGlyph, SideArrow, StopGlyph } from './icons'
import { PORTRAIT_QUERY } from './useDeck'

/*
 * The parts every stand-alone page is made of, in the home page's typography (editorial.css):
 * the strip under the header, the text of the theme on show with its buttons, the arrows
 * with their counter, the numbered navigation with the hint, and — on phones — the story the
 * "watch" button plays, told step by step under the photo.
 */

const pad = (n: number) => String(n).padStart(2, '0')

/* ── Strip under the header ───────────────────────────────────────────── */

export interface StripItem {
  icon?: ReactNode
  name: string
  note: string
}

/**
 * A row of equal parts on a computer; on phones a slow ticker under the header, which is why
 * the items are listed twice (the echo is hidden from assistive technology and larger screens).
 */
export function PageStrip({ items, label }: { items: StripItem[]; label: string }) {
  const row = (echo: boolean) =>
    items.map(({ icon, name, note }) => (
      <li key={echo ? `${name}-echo` : name} aria-hidden={echo || undefined}>
        {icon}
        <span>
          <b>{name}</b>
          <small>{note}</small>
        </span>
      </li>
    ))
  return (
    <div className="pg-strip">
      <ul className="pg-strip__list" aria-label={label} style={{ '--pg-strip-count': items.length } as CSSProperties}>
        {row(false)}
        {row(true)}
      </ul>
    </div>
  )
}

/* ── Buttons ──────────────────────────────────────────────────────────── */

interface CtaProps {
  label: string
  /** The arrow of the home page's call to action, unless another glyph is given. */
  icon?: ReactNode
  href?: string
  onClick?: () => void
  /** A switch (the demo playing). */
  pressed?: boolean
}

/** The home page's call to action: small caps, then a round outlined icon. */
export function Cta({ label, icon = <CtaArrow />, href, onClick, pressed }: CtaProps) {
  const inner = (
    <>
      <span>{label}</span>
      <span className="hc-copy__cta-icon" aria-hidden="true">
        {icon}
      </span>
    </>
  )
  return href ? (
    <a className="hc-copy__cta pg-cta" href={href}>
      {inner}
    </a>
  ) : (
    <button type="button" className="hc-copy__cta pg-cta" aria-pressed={pressed} onClick={onClick}>
      {inner}
    </button>
  )
}

/** "Watch …" ↔ "Stop": plays the page's story. */
export function PlayButton({
  playing,
  watch,
  stop,
  onPlay,
  onStop,
}: {
  playing: boolean
  watch: string
  stop: string
  onPlay: () => void
  onStop: () => void
}) {
  return (
    <Cta
      label={playing ? stop : watch}
      icon={playing ? <StopGlyph /> : <PlayGlyph />}
      pressed={playing}
      onClick={playing ? onStop : onPlay}
    />
  )
}

/* ── The text of the theme on show ────────────────────────────────────── */

export interface DeckText {
  kicker: string
  /** `\n` = a line break of its own. */
  headline: string
  accent: string
  description: string
}

interface DeckCopyProps {
  copyRef: RefObject<HTMLDivElement | null>
  active: number
  ready: boolean
  titles: string[]
  texts: DeckText[]
  titleId: string
  /** The buttons under the text of theme `shown`. */
  actions?: (shown: number) => ReactNode
  /**
   * What stays under the text whichever theme is shown (the projects). On a computer it keeps
   * its place at the bottom of the column while the text changes above it, and is told the
   * room it has there (px) — null on phones, where the page scrolls; undefined until measured.
   */
  below?: (room: number | null | undefined) => ReactNode
  /** The least room `below` can do with (computers). */
  belowMin?: number
}

interface TextBlockProps {
  text: DeckText
  index: number
  title: string
  titleId?: string
  /** The text on show (its lines animate); the hidden copies only measure. */
  live: boolean
}

/** A theme's text, as it shows (the hidden copies measure every theme). */
function TextBlock({ text, index, title, titleId, live }: TextBlockProps) {
  const line = live ? { 'data-line': true } : {}
  const Heading = live ? 'h1' : 'div'
  return (
    <>
      <p className="hc-copy__index" {...line}>
        <span>{pad(index + 1)}</span>
        <i aria-hidden="true" />
        <span>{title}</span>
      </p>
      <p className="hc-copy__kicker" {...line}>
        {text.kicker}
      </p>
      <Heading className="hc-copy__headline" id={titleId}>
        <span {...line}>
          <MultiLine text={text.headline} />
        </span>
        <em {...line}>{text.accent}</em>
      </Heading>
      <p className="hc-copy__description" {...line}>
        {text.description}
      </p>
    </>
  )
}

/**
 * The lines slide out, the text is swapped and the new lines rise in one after another, as
 * on the home page. Where the page is one screen and the text would not fit, the
 * description goes, then the kicker — the type keeps its size. With something below the
 * text, every theme's text is measured (hidden copies), so the room left for it is the same
 * whichever theme is shown.
 */
export function DeckCopy({ copyRef, active, ready, titles, texts, titleId, actions, below, belowMin = 0 }: DeckCopyProps) {
  const { lang } = useI18n()
  const shown = useLineSwap(copyRef, active, ready, 0.05)
  const text = texts[shown]
  const [room, setRoom] = useState<number | null | undefined>(undefined)
  const hasBelow = below !== undefined

  useLayoutEffect(() => {
    const copy = copyRef.current
    const stage = copy?.parentElement
    if (!copy || !stage) return
    const stacked = window.matchMedia(PORTRAIT_QUERY)
    const copies = Array.from(copy.querySelectorAll<HTMLElement>('.pg-copy__measure > *'))
    // (with something below, the column fills the stage: the tallest theme and the least
    // room below must fit in it)
    const inner = () => {
      const style = getComputedStyle(copy)
      return copy.clientHeight - parseFloat(style.paddingTop) - parseFloat(style.paddingBottom)
    }
    const tallest = () => Math.max(...copies.map((c) => c.offsetHeight))
    const fits = () => (hasBelow ? tallest() + belowMin <= inner() : copy.offsetHeight <= stage.clientHeight)
    const fit = () => {
      for (const tight of ['0', '1', '2']) {
        copy.dataset.tight = tight
        if (stacked.matches || fits()) break
      }
    }
    // (the room below is reported from the observer and the fonts, not while laying out)
    const update = () => {
      fit()
      setRoom(hasBelow && !stacked.matches ? Math.max(0, Math.floor(inner() - tallest())) : null)
    }
    fit()
    // Again when the stage resizes or the text does (web fonts arriving).
    const observer = new ResizeObserver(update)
    observer.observe(stage)
    observer.observe(copy)
    for (const c of copies) observer.observe(c)
    void document.fonts?.ready.then(update)
    stacked.addEventListener('change', update)
    return () => {
      observer.disconnect()
      stacked.removeEventListener('change', update)
    }
  }, [copyRef, shown, lang, hasBelow, belowMin])

  return (
    <div ref={copyRef} className="pg-copy" data-below={hasBelow || undefined}>
      <div className="pg-copy__text">
        <TextBlock text={text} index={shown} title={titles[shown]} titleId={titleId} live />
        {actions && (
          <div className="pg-copy__actions" data-line>
            {actions(shown)}
          </div>
        )}
      </div>
      {hasBelow && (
        <div className="pg-copy__measure" aria-hidden="true">
          {texts.map((t, i) => (
            <div key={i}>
              <TextBlock text={t} index={i} title={titles[i]} live={false} />
            </div>
          ))}
        </div>
      )}
      {below?.(room)}
    </div>
  )
}

/* ── Arrows and counter, numbered navigation ──────────────────────────── */

export function DeckControls({ active, count, onPrev, onNext }: { active: number; count: number; onPrev: () => void; onNext: () => void }) {
  const { t } = useI18n()
  return (
    <div className="hc-controls pg-controls">
      <button type="button" className="hc-controls__btn" aria-label={t.prevTheme} onClick={onPrev}>
        <SideArrow direction="left" />
      </button>
      <p className="hc-controls__count" aria-hidden="true">
        <span>{pad(active + 1)}</span>
        <i />
        <span>{pad(count)}</span>
      </p>
      <button type="button" className="hc-controls__btn" aria-label={t.nextTheme} onClick={onNext}>
        <SideArrow direction="right" />
      </button>
    </div>
  )
}

interface DeckNavProps {
  label: string
  items: { title: string; note: string }[]
  active: number
  onSelect: (index: number) => void
}

/** A theme's title in its tab: at a `\n` it breaks on phones (CSS), and reads as one line elsewhere. */
function TabTitle({ text }: { text: string }) {
  return text.split('\n').map((part, i) => (
    <Fragment key={i}>
      {i > 0 && (
        <>
          {' '}
          <br className="hc-nav__break" />
        </>
      )}
      {part}
    </Fragment>
  ))
}

export function DeckNav({ label, items, active, onSelect }: DeckNavProps) {
  const { t } = useI18n()
  return (
    <nav className="hc-nav pg-nav" aria-label={label} style={{ '--hc-nav-count': items.length } as CSSProperties}>
      <ul className="hc-nav__list">
        {items.map(({ title, note }, i) => (
          <li key={title}>
            <button type="button" className="hc-nav__item" aria-current={i === active ? 'true' : undefined} onClick={() => onSelect(i)}>
              <span className="hc-nav__index">{pad(i + 1)}</span>
              <span className="hc-nav__title">
                <TabTitle text={title} />
              </span>
              <span className="hc-nav__subtitle">{note}</span>
            </button>
          </li>
        ))}
      </ul>
      <p className="hc-nav__hint" aria-hidden="true">
        <span className="hc-nav__mouse" />
        {t.pageHint}
      </p>
    </nav>
  )
}

/* ── The story, step by step (phones) ─────────────────────────────────── */

export interface StoryStep {
  time: string
  name: string
  does: string
}

interface DeckStoryProps {
  open: boolean
  title: string
  steps: StoryStep[]
  /** The step the demo is on (null while it is not playing)… */
  playing: number | null
  /** …or the one chosen by hand. */
  chosen: number | null
  stepMs: number
  onStep: (step: number) => void
  onPlay: () => void
  onStop: () => void
  replay: string
  stop: string
}

/**
 * Under the photo on phones, once the demo has been started: the steps side by side, as the
 * home page's navigation — the line over the step playing fills while it lasts, the steps
 * done stay drawn. A step can be tapped to show it again. With more than three steps, only
 * the one on show says what it does, under the row.
 */
export function DeckStory({ open, title, steps, playing, chosen, stepMs, onStep, onPlay, onStop, replay, stop }: DeckStoryProps) {
  const isPlaying = playing !== null
  return (
    <section className="pg-story" data-open={open || undefined} aria-label={title}>
      <div className="pg-story__head">
        <p className="pg-story__title">{title}</p>
        <button
          type="button"
          className="pg-story__play"
          aria-pressed={isPlaying}
          aria-label={isPlaying ? stop : replay}
          title={isPlaying ? stop : replay}
          onClick={isPlaying ? onStop : onPlay}
        >
          {isPlaying ? <StopGlyph /> : <PlayGlyph />}
        </button>
      </div>
      <ol className="pg-story__steps" style={{ '--pg-story-count': steps.length } as CSSProperties} data-count={steps.length}>
        {steps.map((step, i) => {
          const state = isPlaying ? (i < playing ? 'done' : i === playing ? 'now' : 'next') : i === chosen ? 'chosen' : 'next'
          return (
            <li key={step.name} data-state={state}>
              <button type="button" aria-current={state === 'now' || state === 'chosen' ? 'step' : undefined} onClick={() => onStep(i)}>
                <i className="pg-story__line" aria-hidden="true" style={{ animationDuration: `${stepMs}ms` }} />
                <span className="pg-story__time">{step.time}</span>
                <b>{step.name}</b>
                <small>{step.does}</small>
              </button>
            </li>
          )
        })}
      </ol>
      <p className="pg-story__does">{steps[playing ?? chosen ?? 0].does}</p>
    </section>
  )
}
