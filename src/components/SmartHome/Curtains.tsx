import { Fragment, type CSSProperties } from 'react'
import './linen.css'

const SIDES = ['left', 'right'] as const

/** The panels of one copy of the curtains, driven by `--sh-curtain`, `--sh-sway` and `--sh-flutter` (useCurtainMotor). */
function Drapes() {
  return (
    <div className="sh-drapes" data-curtain-el>
      {SIDES.map((side) => (
        <Fragment key={side}>
          <div className="sh-fabric sh-linen" data-side={side}>
            <i className="sh-fabric__lit" />
          </div>
          <i className="sh-hem" data-side={side} />
        </Fragment>
      ))}
    </div>
  )
}

/**
 * Sheer curtains across the whole screen, in front of the room, with their reflection on the
 * floor. Large screens: one panel from the far left edge of the screen up to `end`, just before
 * the control panel. Phones: a pair from both screen edges, meeting in the middle.
 */
export function CurtainBand({ end }: { end: string }) {
  return (
    <div className="sh-band" style={{ '--sh-curtain-end': end } as CSSProperties} aria-hidden="true">
      <Drapes />
      <div className="sh-band__reflection">
        <div className="sh-band__mirror">
          <Drapes />
        </div>
      </div>
    </div>
  )
}
