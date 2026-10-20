import type { CSSProperties } from 'react'
import type { PanelRect } from '../../data/slides'
import { useI18n } from '../../i18n/context'
import { ControlScreen, type ControlScreenProps } from './ControlScreen'

interface HomeWallProps extends Omit<ControlScreenProps, 'variant'> {
  /** Where the dark glass of the photographed panel is, per layout. */
  rect: { landscape: PanelRect; portrait: PanelRect }
}

const rectVars = (r: PanelRect, prefix: 'l' | 'p') => ({
  [`--sh-${prefix}-x`]: `${r.left}%`,
  [`--sh-${prefix}-y`]: `${r.top}%`,
  [`--sh-${prefix}-w`]: `${r.width}%`,
  [`--sh-${prefix}-h`]: `${r.height}%`,
  [`--sh-${prefix}-r`]: `${r.radiusX}% / ${r.radiusY}%`,
})

/**
 * Everything that lives on the Smart Home wall, inside the slide (so it turns, dims and
 * fades with it): the pool of light from the wall-washers, the live control screen, the
 * invitation above it and the curtains that can be drawn across.
 */
export function HomeWall({ rect, ...screen }: HomeWallProps) {
  const { t } = useI18n()
  const style = { ...rectVars(rect.landscape, 'l'), ...rectVars(rect.portrait, 'p') } as CSSProperties

  return (
    <div className="sh-wall" style={style}>
      <div className="sh-warm" aria-hidden="true" />
      <ControlScreen {...screen} variant="wall" />
      <p className="sh-invite" aria-hidden="true">
        <span className="sh-invite__dot" />
        {t.homeInvite}
        <svg viewBox="0 0 24 24">
          <path d="M6 9l6 6 6-6" />
        </svg>
      </p>
      <Curtain />
    </div>
  )
}

/** Two sheer panels drawn in from the sides as far as `--sh-curtain` says (also used in the floor reflection). */
export function Curtain() {
  return (
    <div className="sh-curtain" aria-hidden="true">
      <div className="sh-curtain__panel" data-side="left">
        <i className="sh-curtain__lit" />
      </div>
      <div className="sh-curtain__panel" data-side="right">
        <i className="sh-curtain__lit" />
      </div>
    </div>
  )
}
