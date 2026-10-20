import { useCallback, useEffect, useState, useSyncExternalStore } from 'react'

export type Dimmable = 'lights' | 'fan' | 'curtain'
export type Appliance = Dimmable | 'ac'

export interface Device {
  on: boolean
  /** 1–100 %. Kept while the device is off, so it comes back on at the same level. */
  level: number
}

export interface HomeState {
  /** cct = colour temperature in kelvin. */
  lights: Device & { cct: number }
  fan: Device
  /** On = drawn closed by `level` %. */
  curtain: Device
  ac: { on: boolean; temp: number }
}

/** Level of a device switched on for the first time. */
export const DEFAULT_LEVEL = 69
export const MIN_TEMP = 16
export const MAX_TEMP = 30
export const MIN_CCT = 2700
export const MAX_CCT = 6500
const DEFAULT_TEMP = 24
const DEFAULT_CCT = 3000
const STORAGE_KEY = 'villa-nest-home'

const isNumber = (n: unknown): n is number => typeof n === 'number' && Number.isFinite(n)
const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n))
const clampLevel = (n: unknown) => (isNumber(n) ? clamp(Math.round(n), 1, 100) : DEFAULT_LEVEL)
const clampTemp = (n: unknown) => (isNumber(n) ? clamp(Math.round(n), MIN_TEMP, MAX_TEMP) : DEFAULT_TEMP)
const clampCct = (n: unknown) => (isNumber(n) ? clamp(Math.round(n / 100) * 100, MIN_CCT, MAX_CCT) : DEFAULT_CCT)

/** Levels, colour temperature and set point are remembered between visits; every device starts off. */
function initialState(): HomeState {
  let saved: Record<string, unknown> = {}
  try {
    saved = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? '{}') ?? {}
  } catch {
    // Private mode or an unreadable value: start from the defaults.
  }
  return {
    lights: { on: false, level: clampLevel(saved.lights), cct: clampCct(saved.cct) },
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
        JSON.stringify({ lights: lights.level, cct: lights.cct, fan: fan.level, curtain: curtain.level, temp: ac.temp }),
      )
    } catch {
      // Not remembered this time.
    }
  }, [lights.level, lights.cct, fan.level, curtain.level, ac.temp])

  useEffect(() => climateStore.setAirCon(ac.on, ac.temp), [ac.on, ac.temp])

  /** Tap on a card: on ↔ off, keeping the level. */
  const toggle = useCallback(
    (key: Appliance) =>
      setHome((h) => (key === 'ac' ? { ...h, ac: { ...h.ac, on: !h.ac.on } } : { ...h, [key]: { ...h[key], on: !h[key].on } })),
    [],
  )
  const switchOff = useCallback(
    (key: Appliance) => setHome((h) => (h[key].on ? { ...h, [key]: { ...h[key], on: false } } : h)),
    [],
  )
  /** Slider: sets the level and switches the device on. */
  const setLevel = useCallback(
    (key: Dimmable, level: number) => setHome((h) => ({ ...h, [key]: { ...h[key], on: true, level: clampLevel(level) } })),
    [],
  )
  /** Colour-temperature slider: also switches the lights on. */
  const setCct = useCallback(
    (cct: number) => setHome((h) => ({ ...h, lights: { ...h.lights, on: true, cct: clampCct(cct) } })),
    [],
  )
  const nudgeTemp = useCallback(
    (delta: number) => setHome((h) => ({ ...h, ac: { ...h.ac, temp: clampTemp(h.ac.temp + delta) } })),
    [],
  )
  return { home, toggle, switchOff, setLevel, setCct, nudgeTemp }
}

/** Snow for the air-con: the colder the set point, the thicker it falls (0 when off). */
export const snowDensity = ({ ac }: HomeState) =>
  ac.on ? 0.18 + (0.82 * (MAX_TEMP - ac.temp)) / (MAX_TEMP - MIN_TEMP) : 0

/** Wind from the fan, 0–1 (0 when off). */
export const windStrength = ({ fan }: HomeState) => (fan.on ? fan.level / 100 : 0)

/* ── Indoor climate shown on the screen (simulated) ──────────────────────── */

export interface Climate {
  /** Room temperature, °C. */
  temp: number
  /** Fine dust, µg/m³. */
  pm25: number
  /** ppm. */
  co2: number
}

export type AirQuality = 'good' | 'fair' | 'poor'
export const pm25Quality = (v: number): AirQuality => (v <= 12 ? 'good' : v <= 35 ? 'fair' : 'poor')
export const co2Quality = (v: number): AirQuality => (v < 800 ? 'good' : v < 1200 ? 'fair' : 'poor')

/** A warm evening outside; the room settles there without air-con. */
const ROOM_TEMP = 29.5
const TICK = 2000

/**
 * One simulation shared by every screen (the copies around the carousel and the enlarged
 * one show the same numbers): the room cools towards the set point while the air-con runs
 * and warms back up when it stops, the air-con filter lowers PM2.5, CO₂ wanders a little.
 * It only ticks while a screen is mounted.
 */
const climateStore = (() => {
  let airCon = { on: false, temp: DEFAULT_TEMP }
  let climate: Climate = { temp: ROOM_TEMP - 0.4, pm25: 10, co2: 640 }
  const listeners = new Set<() => void>()
  let timer = 0

  const tick = () => {
    const target = airCon.on ? airCon.temp : ROOM_TEMP
    const step = airCon.on ? 0.3 : 0.1
    const d = target - climate.temp
    const temp = Math.abs(d) <= step ? target : climate.temp + Math.sign(d) * step
    const pm = climate.pm25 + ((airCon.on ? 5 : 10) - climate.pm25) * 0.08 + (Math.random() - 0.5) * 0.8
    const co2 = climate.co2 + (640 - climate.co2) * 0.05 + (Math.random() - 0.5) * 16
    climate = { temp: Math.round(temp * 10) / 10, pm25: clamp(pm, 3, 80), co2: clamp(co2, 450, 1400) }
    listeners.forEach((listener) => listener())
  }

  return {
    subscribe(listener: () => void) {
      listeners.add(listener)
      if (!timer) timer = window.setInterval(tick, TICK)
      return () => {
        listeners.delete(listener)
        if (!listeners.size) {
          window.clearInterval(timer)
          timer = 0
        }
      }
    },
    get: () => climate,
    setAirCon(on: boolean, temp: number) {
      airCon = { on, temp }
    },
  }
})()

export const useClimate = () => useSyncExternalStore(climateStore.subscribe, climateStore.get)
