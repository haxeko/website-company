import { useCallback, useState } from 'react'

export interface HomeState {
  lights: boolean
  ac: boolean
  fan: boolean
  /** Air-con set point, °C. */
  temp: number
}

export type Appliance = 'lights' | 'ac' | 'fan'

export const MIN_TEMP = 16
export const MAX_TEMP = 30

const INITIAL: HomeState = { lights: false, ac: false, fan: false, temp: 24 }

/** State of the demo home, shared by every copy of the control screen around the ring. */
export function useHomeState() {
  const [home, setHome] = useState(INITIAL)
  const toggle = useCallback((key: Appliance) => setHome((h) => ({ ...h, [key]: !h[key] })), [])
  const nudgeTemp = useCallback(
    (delta: number) =>
      setHome((h) => ({ ...h, temp: Math.min(MAX_TEMP, Math.max(MIN_TEMP, h.temp + delta)) })),
    [],
  )
  return { home, toggle, nudgeTemp }
}
