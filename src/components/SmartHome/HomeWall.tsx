import type { CSSProperties } from 'react'
import type { PanelRect } from '../../data/slides'
import { useI18n } from '../../i18n/context'
import { ControlScreen, type ControlScreenProps } from './ControlScreen'

interface HomeWallProps extends Omit<ControlScreenProps, 'variant'> {
  /** Where the dark glass of the photographed panel is, per layout. */
  rect: { landscape: PanelRect; portrait: PanelRect }
}

/** The CSS twin of the projection the panel was composited with: turned about its left edge. */
const tiltTransform = (r: PanelRect) =>
  r.tilt ? `perspective(calc(var(--hc-w) * ${r.perspective.toFixed(4)})) rotateY(${r.tilt}deg)` : 'none'

const rectVars = (r: PanelRect, prefix: 'l' | 'p') => ({
  [`--sh-${prefix}-x`]: `${r.left}%`,
  [`--sh-${prefix}-y`]: `${r.top}%`,
  [`--sh-${prefix}-w`]: `${r.width}%`,
  [`--sh-${prefix}-h`]: `${r.height}%`,
  [`--sh-${prefix}-r`]: `${r.radiusX}% / ${r.radiusY}%`,
  [`--sh-${prefix}-cx`]: `${r.centerX}%`,
  [`--sh-${prefix}-tf`]: tiltTransform(r),
})

/**
 * Everything that lives on the Smart Home wall, inside the slide (so it turns, dims and
 * fades with it): the room's darkness and the pool of light from the wall-washers, the live
 * control screen set into the stone and the invitation above it.
 */
export function HomeWall({ rect, ...screen }: HomeWallProps) {
  const { t } = useI18n()
  const style = { ...rectVars(rect.landscape, 'l'), ...rectVars(rect.portrait, 'p') } as CSSProperties

  return (
    <div className="sh-wall" style={style}>
      <div className="sh-dark" aria-hidden="true" />
      <div className="sh-warm" aria-hidden="true" />
      <ControlScreen {...screen} variant="wall" />
      <p className="sh-invite" aria-hidden="true">
        <span className="sh-invite__dot" />
        {t.homeInvite}
        <svg viewBox="0 0 24 24">
          <path d="M6 9l6 6 6-6" />
        </svg>
      </p>
    </div>
  )
}
