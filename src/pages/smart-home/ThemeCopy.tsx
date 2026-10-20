import type { ReactNode, RefObject } from 'react'
import { MultiLine } from '../../components/HeroCarousel/HeroCopy'
import { useLineSwap } from '../../components/HeroCarousel/useLineSwap'
import type { PageCopy, SectionId } from './content'
import { ArrowIcon } from './icons'

const pad = (n: number) => String(n).padStart(2, '0')

interface ThemeCopyProps {
  copy: PageCopy
  themes: SectionId[]
  active: number
  ready: boolean
  copyRef: RefObject<HTMLDivElement | null>
  /** Next to the call to action (the living-scene demo). */
  extra: ReactNode
}

/**
 * The text of the theme on show, with the home page's typography and change of slide: the
 * lines slide out, the text is swapped and the new lines rise in one after another.
 */
export function ThemeCopy({ copy, themes, active, ready, copyRef, extra }: ThemeCopyProps) {
  const shown = useLineSwap(copyRef, active, ready, 0.35)
  const id = themes[shown]
  const theme = copy.themes[id]

  return (
    <div ref={copyRef} className="shp-copy">
      <p className="hc-copy__index" data-line>
        <span>{pad(shown + 1)}</span>
        <i aria-hidden="true" />
        <span>{copy.features[id].title}</span>
      </p>
      <p className="hc-copy__kicker" data-line>
        {theme.kicker}
      </p>
      <h1 className="hc-copy__headline" id="shp-title">
        <span data-line>
          <MultiLine text={theme.headline} />
        </span>
        <em data-line>{theme.accent}</em>
      </h1>
      <p className="hc-copy__description" data-line>
        {theme.description}
      </p>
      <div className="shp-copy__actions" data-line>
        <a className="shp-button" href={`#${id}`}>
          {theme.cta}
          <span className="shp-button__icon">
            <ArrowIcon />
          </span>
        </a>
        {extra}
      </div>
    </div>
  )
}
