import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * A page's "watch" demo: its story plays step by step, `stepMs` apart — `onStep(i)` shows
 * step i — then `onEnd` puts things back. `step` is the step on show (null when not playing).
 */
export function useDemo(count: number, stepMs: number, onStep: (step: number) => void, onEnd?: () => void) {
  const [step, setStep] = useState<number | null>(null)
  const timer = useRef(0)

  const stop = useCallback(() => {
    window.clearTimeout(timer.current)
    setStep(null)
  }, [])

  const play = useCallback(() => {
    window.clearTimeout(timer.current)
    const run = (i: number) => {
      if (i >= count) {
        setStep(null)
        onEnd?.()
        return
      }
      setStep(i)
      onStep(i)
      timer.current = window.setTimeout(() => run(i + 1), stepMs)
    }
    run(0)
  }, [count, stepMs, onStep, onEnd])

  useEffect(() => () => window.clearTimeout(timer.current), [])

  return { step, play, stop }
}
