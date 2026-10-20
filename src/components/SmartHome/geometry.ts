import type { PanelRect } from '../../data/slides'

/**
 * On large screens the curtain runs from the far left up to just before the panel's frame,
 * leaving room for the hem to billow in the fan's wind without brushing over the glass.
 */
export const curtainEnd = (rect: { landscape: PanelRect }) => `${(rect.landscape.frameLeft - 2.2).toFixed(2)}%`
