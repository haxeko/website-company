import { Fragment, useLayoutEffect, useRef, type CSSProperties } from 'react'
import type { Slide } from '../../data/slides'
import { useI18n } from '../../i18n/context'
import './editorial.css'
import { useLineSwap } from './useLineSwap'

interface HeroCopyProps {
  slides: Slide[]
  active: number
  /** Images loaded and the entrance animation started. */
  ready: boolean
}

const pad = (n: number) => String(n).padStart(2, '0')

/** Text with `\n` line breaks of its own (headlines broken where the copy says). */
export function MultiLine({ text }: { text: string }) {
  return text.split('\n').map((line, i) => (
    <Fragment key={i}>
      {i > 0 && <br />}
      {line}
    </Fragment>
  ))
}

/**
 * The editorial text of the space in the centre. When the space changes, the lines slide
 * out, the text is swapped and the new lines rise in one after another (useLineSwap).
 */
export function HeroCopy({ slides, active, ready }: HeroCopyProps) {
  const { lang } = useI18n()
  const rootRef = useRef<HTMLDivElement>(null)
  const shown = useLineSwap(rootRef, active, ready)

  // Phones: when the text would run into the bottom navigation, the description goes, then
  // the kicker — the type keeps its size.
  useLayoutEffect(() => {
    const copy = rootRef.current
    const root = copy?.parentElement
    const nav = root?.querySelector<HTMLElement>('.hc-nav')
    if (!copy || !root || !nav) return
    const fit = () => {
      for (const tight of ['0', '1', '2']) {
        copy.dataset.tight = tight
        // (layout boxes, not the animated ones)
        if (root.dataset.layout !== 'portrait' || copy.offsetTop + copy.offsetHeight <= nav.offsetTop - 8) break
      }
    }
    fit()
    const observer = new ResizeObserver(fit)
    observer.observe(root)
    return () => observer.disconnect()
  }, [shown, lang])

  const slide = slides[shown]
  const copy = slide.copy[lang]

  // A space with a live panel in the middle of its card (Smart Home): on a computer the text keeps clear of it.
  const panel = slide.screen?.landscape

  return (
    <div
      ref={rootRef}
      className="hc-copy"
      data-panel={panel ? true : undefined}
      style={panel ? ({ '--hc-panel-x': panel.frameLeft / 100 } as CSSProperties) : undefined}
    >
      <p className="hc-copy__index" data-line>
        <span>{pad(shown + 1)}</span>
        <i aria-hidden="true" />
        <span>{copy.title}</span>
      </p>
      <p className="hc-copy__kicker" data-line>
        {copy.kicker}
      </p>
      <h2 className="hc-copy__headline">
        <span data-line>
          <MultiLine text={copy.headline} />
        </span>
        <em data-line>{copy.accent}</em>
      </h2>
      <p className="hc-copy__description" data-line>
        {copy.description}
      </p>
      <a className="hc-copy__cta" href={slide.ctaHref} data-line>
        <span>{copy.cta}</span>
        <span className="hc-copy__cta-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24">
            <path d="M7 17 17 7M9 7h8v8" />
          </svg>
        </span>
      </a>
    </div>
  )
}
