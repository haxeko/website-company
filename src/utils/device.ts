type NavigatorHints = Navigator & {
  deviceMemory?: number
  connection?: { saveData?: boolean }
}

export interface QualityHint {
  /** Start in low-power mode (no blur filter, reflections or grain). */
  lowPower: boolean
  /** Set by ?quality=low|high — disables the automatic switch to low-power mode. */
  forced: boolean
}

/**
 * Initial rendering quality. `?quality=low` / `?quality=high` force a mode; otherwise very
 * weak devices and Data Saver start in low-power mode, and the carousel can still switch
 * at runtime if transitions turn out to be slow.
 */
export function getQualityHint(): QualityHint {
  const param = new URLSearchParams(window.location.search).get('quality')
  if (param === 'low') return { lowPower: true, forced: true }
  if (param === 'high') return { lowPower: false, forced: true }

  const nav = navigator as NavigatorHints
  const weak =
    (nav.deviceMemory !== undefined && nav.deviceMemory <= 2) ||
    (nav.hardwareConcurrency > 0 && nav.hardwareConcurrency <= 2) ||
    nav.connection?.saveData === true
  return { lowPower: weak, forced: false }
}

export const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)'
export const FINE_POINTER_QUERY = '(hover: hover) and (pointer: fine)'
