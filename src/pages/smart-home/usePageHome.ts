import { useCallback, useEffect, useRef, useState } from 'react'
import type { SceneId } from './content'

export interface PageHome {
  lights: { on: boolean; level: number }
  /** On = drawn closed by `level` %. */
  curtain: { on: boolean; level: number }
  ac: { on: boolean; temp: number }
  armed: boolean
  /** The scene last applied from the panel, until something is changed by hand. */
  mode: SceneId | null
}

export type PageDevice = 'lights' | 'curtain' | 'ac'

export const MIN_TEMP = 16
export const MAX_TEMP = 30

/** As in the photo: an evening with the lamps on, the alarm armed. */
const INITIAL: PageHome = {
  lights: { on: true, level: 80 },
  curtain: { on: false, level: 100 },
  ac: { on: false, temp: 24 },
  armed: true,
  mode: null,
}

const SCENES: Record<SceneId, (h: PageHome) => PageHome> = {
  home: (h) => ({
    lights: { on: true, level: 80 },
    curtain: { ...h.curtain, on: false },
    ac: { on: true, temp: 25 },
    armed: false,
    mode: 'home',
  }),
  relax: () => ({
    lights: { on: true, level: 40 },
    curtain: { on: true, level: 50 },
    ac: { on: true, temp: 26 },
    armed: false,
    mode: 'relax',
  }),
  sleep: () => ({
    lights: { on: false, level: 80 },
    curtain: { on: true, level: 100 },
    ac: { on: true, temp: 27 },
    armed: true,
    mode: 'sleep',
  }),
}

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, Math.round(n)))

/** The demo home of the Smart Home page (not remembered: every visit starts as in the photo). */
export function usePageHome() {
  const [home, setHome] = useState(INITIAL)

  const toggle = useCallback(
    (key: PageDevice) => setHome((h) => ({ ...h, [key]: { ...h[key], on: !h[key].on }, mode: null })),
    [],
  )
  const setLevel = useCallback(
    (key: 'lights' | 'curtain', level: number) =>
      setHome((h) => ({ ...h, [key]: { on: true, level: clamp(level, 1, 100) }, mode: null })),
    [],
  )
  const setTemp = useCallback(
    (temp: number) => setHome((h) => ({ ...h, ac: { on: true, temp: clamp(temp, MIN_TEMP, MAX_TEMP) }, mode: null })),
    [],
  )
  const toggleArmed = useCallback(() => setHome((h) => ({ ...h, armed: !h.armed, mode: null })), [])
  const applyScene = useCallback((scene: SceneId) => setHome((h) => SCENES[scene](h)), [])
  const reset = useCallback(() => setHome(INITIAL), [])

  return { home, toggle, setLevel, setTemp, toggleArmed, applyScene, reset }
}

const STEPS: SceneId[] = ['home', 'relax', 'sleep']
const STEP_MS = 3800

/**
 * "Watch a living scene": the day plays on the panel — coming home, unwinding, good night —
 * then the room returns to how it was. `scene` is the step on show (null when not playing).
 */
export function useSceneDemo(applyScene: (scene: SceneId) => void, reset: () => void, onStep?: () => void) {
  const [scene, setScene] = useState<SceneId | null>(null)
  const timer = useRef(0)

  const stop = useCallback(() => {
    window.clearTimeout(timer.current)
    setScene(null)
  }, [])

  const play = useCallback(() => {
    window.clearTimeout(timer.current)
    const run = (i: number) => {
      if (i >= STEPS.length) {
        setScene(null)
        reset()
        onStep?.()
        return
      }
      setScene(STEPS[i])
      applyScene(STEPS[i])
      onStep?.()
      timer.current = window.setTimeout(() => run(i + 1), STEP_MS)
    }
    run(0)
  }, [applyScene, reset, onStep])

  useEffect(() => () => window.clearTimeout(timer.current), [])

  return { scene, play, stop }
}
