import type { CSSProperties } from 'react'
import type { PanelRect } from '../../data/slides'
import { useI18n } from '../../i18n/context'
import { ControlScreen, type ControlScreenProps } from './ControlScreen'
import { curtainEnd } from './geometry'

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
  [`--sh-${prefix}-tf`]: tiltTransform(r),
})

/**
 * Everything that lives on the Smart Home wall, inside the slide (so it turns, dims and
 * fades with it): the room's darkness and the pool of light from the wall-washers, the live
 * control screen set into the stone, the invitation above it and the curtain.
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
      <Curtain end={curtainEnd(rect)} />
    </div>
  )
}

/**
 * Sheer curtain panels. `end` (large screens, inside the slide): one panel from the far
 * left, drawn up to `end`. Without it (phones, across the screen): a pair meeting in the
 * middle. Driven by `--sh-curtain`, `--sh-sway` and `--sh-flutter` (useCurtainMotor).
 */
export function Curtain({ end, className = 'sh-curtain' }: { end?: string; className?: string }) {
  const style = end ? ({ '--sh-curtain-end': end } as CSSProperties) : undefined
  return (
    <div className={className} style={style} data-curtain-el data-pair={end ? undefined : true} aria-hidden="true">
      <div className="sh-fabric" data-side="left">
        <i className="sh-fabric__lit" />
      </div>
      {!end && (
        <div className="sh-fabric" data-side="right">
          <i className="sh-fabric__lit" />
        </div>
      )}
    </div>
  )
}
