import type { PanelRect } from '../../data/slides'

/**
 * Large screens: the curtain runs from the far left edge of the screen up to just before the
 * frame of the control panel in the centred slide, leaving room for the hem to billow in the
 * fan's wind without brushing over the glass. A length across the screen, for CSS.
 */
export const curtainEnd = (rect: { landscape: PanelRect }) =>
  `calc(50% - var(--hc-w) * ${(0.5 - (rect.landscape.frameLeft - 2.2) / 100).toFixed(4)})`
