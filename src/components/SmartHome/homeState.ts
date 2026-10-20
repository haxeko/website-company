import { useCallback, useEffect, useState } from 'react'

export type Dimmable = 'lights' | 'fan' | 'curtain'
export type Appliance = Dimmable | 'ac'

export interface Device {
  on: boolean
  /** 1–100 %. Kept while the device is off, so it comes back on at the same level. */
  level: number
}

export interface HomeState {
  lights: Device
  fan: Device
  /** On = drawn closed by `level` %. */
  curtain: Device
  ac: { on: boolean; temp: number }
}

/** Level of a device switched on for the first time. */
export const DEFAULT_LEVEL = 69
export const MIN_TEMP = 16
export const MAX_TEMP = 30
const DEFAULT_TEMP = 24
const STORAGE_KEY = 'villa-nest-home'

const isNumber = (n: unknown): n is number => typeof n === 'number' && Number.isFinite(n)
const clampLevel = (n: unknown) => (isNumber(n) ? Math.min(100, Math.max(1, Math.round(n))) : DEFAULT_LEVEL)
const clampTemp = (n: unknown) => (isNumber(n) ? Math.min(MAX_TEMP, Math.max(MIN_TEMP, Math.round(n))) : DEFAULT_TEMP)

/** Levels and the set point are remembered between visits; every device starts switched off. */
function initialState(): HomeState {
  let saved: Record<string, unknown> = {}
  try {
    saved = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? '{}') ?? {}
  } catch {
    // Private mode or an unreadable value: start from the defaults.
  }
  return {
    lights: { on: false, level: clampLevel(saved.lights) },
    fan: { on: false, level: clampLevel(saved.fan) },
    curtain: { on: false, level: clampLevel(saved.curtain) },
    ac: { on: false, temp: clampTemp(saved.temp) },
  }
}

/** State of the demo home, shared by every copy of the control screen. */
export function useHomeState() {
  const [home, setHome] = useState(initialState)
  const { lights, fan, curtain, ac } = home

  useEffect(() => {
    try {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ lights: lights.level, fan: fan.level, curtain: curtain.level, temp: ac.temp }),
      )
    } catch {
      // Not remembered this time.
    }
  }, [lights.level, fan.level, curtain.level, ac.temp])

  /** Tap on a card: on ↔ off, keeping the level. */
  const toggle = useCallback(
    (key: Appliance) =>
      setHome((h) => (key === 'ac' ? { ...h, ac: { ...h.ac, on: !h.ac.on } } : { ...h, [key]: { ...h[key], on: !h[key].on } })),
    [],
  )
  /** Slider: sets the level and switches the device on. */
  const setLevel = useCallback(
    (key: Dimmable, level: number) => setHome((h) => ({ ...h, [key]: { on: true, level: clampLevel(level) } })),
    [],
  )
  const nudgeTemp = useCallback(
    (delta: number) => setHome((h) => ({ ...h, ac: { ...h.ac, temp: clampTemp(h.ac.temp + delta) } })),
    [],
  )
  return { home, toggle, setLevel, nudgeTemp }
}

/** Snow for the air-con: the colder the set point, the thicker it falls (0 when off). */
export const snowDensity = ({ ac }: HomeState) =>
  ac.on ? 0.18 + (0.82 * (MAX_TEMP - ac.temp)) / (MAX_TEMP - MIN_TEMP) : 0

/** Wind from the fan, 0–1 (0 when off). */
export const windStrength = ({ fan }: HomeState) => (fan.on ? fan.level / 100 : 0)
