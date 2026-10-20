import { gsap } from 'gsap'
import { useEffect, useRef, type RefObject } from 'react'
import { REDUCED_MOTION_QUERY } from '../../utils/device'
import { MAX_CCT, MIN_CCT, type HomeState } from './homeState'

const cctFraction = (kelvin: number) => (kelvin - MIN_CCT) / (MAX_CCT - MIN_CCT)
const WARM = [255, 186, 116]
const COOL = [212, 226, 255]

/**
 * Light in the room, as CSS custom properties on `element`:
 *   --sh-light       0–1 brightness of the lamps
 *   --sh-dark        how dark the room is with the lamps off
 *   --sh-light-rgb   colour of the light, from warm 2700 K to cool 6500 K
 *   --sh-img-filter  lift for the wall photo (a ready-made string: calc() inside filter functions is not safe everywhere)
 */
function paintLight(element: HTMLElement, level: number, cct: number) {
  const rgb = WARM.map((w, i) => Math.round(w + (COOL[i] - w) * cct)).join(' ')
  const style = element.style
  style.setProperty('--sh-light', level.toFixed(4))
  style.setProperty('--sh-dark', (0.36 * (1 - level) ** 3).toFixed(4))
  style.setProperty('--sh-light-rgb', rgb)
  style.setProperty(
    '--sh-img-filter',
    level > 0.001
      ? `brightness(${(1 + 0.42 * level).toFixed(3)}) sepia(${(0.26 * level * (1 - cct)).toFixed(3)}) saturate(${(1 + 0.12 * level - 0.2 * level * cct).toFixed(3)})`
      : 'none',
  )
}

/** Lamps fade up / down quickly when switched, and follow the sliders. */
export function useLightAtmosphere(ref: RefObject<HTMLElement | null>, { lights }: HomeState) {
  const state = useRef({ level: 0, cct: cctFraction(lights.cct), on: lights.on })

  useEffect(() => {
    const element = ref.current
    if (!element) return
    const s = state.current
    const switched = s.on !== lights.on
    s.on = lights.on
    const reduced = window.matchMedia(REDUCED_MOTION_QUERY).matches
    const paint = () => paintLight(element, s.level, s.cct)
    paint()
    const tween = gsap.to(s, {
      level: lights.on ? lights.level / 100 : 0,
      cct: cctFraction(lights.cct),
      duration: reduced ? 0.2 : switched ? 0.85 : 0.3,
      ease: switched ? 'power2.inOut' : 'power2.out',
      overwrite: true,
      onUpdate: paint,
    })
    return () => {
      tween.kill()
    }
  }, [ref, lights.on, lights.level, lights.cct])
}

/* ── Curtains ──────────────────────────────────────────────────────────── */

/** Like a motorised track: about 4 s end to end, at constant speed with a soft start and stop. */
const MAX_SPEED = 0.24 // travel / s
const ACCEL = 0.8 // travel / s²
/** The hanging fabric: a damped pendulum (≈1 swing a second) pushed by the carrier's acceleration. */
const SWAY_STIFFNESS = 38
const SWAY_DAMPING = 3
const SWAY_GAIN = 50 // deg per travel/s²
/** Swing kept within what the fabric hidden past the stack edge can cover (--sh-overhang). */
const MAX_SWAY = 2.5 // deg

/**
 * Drives every curtain on the page (`[data-curtain-el]`, inside `ref`) through
 *   --sh-curtain  0–1 how far it is drawn
 *   --sh-sway     the hem swinging on when the motor starts / stops (deg; mirrored panels swing mirrored)
 *   --sh-flutter  the hem billowing in the fan's wind (deg; always downwind, left → right)
 * and marks `ref` with `data-curtain` while any curtain is out, so they are only rendered then.
 */
export function useCurtainMotor(ref: RefObject<HTMLElement | null>, target: number, wind: number) {
  const goal = useRef({ target, wind })
  const wake = useRef<() => void>(() => {})

  useEffect(() => {
    goal.current = { target, wind }
    wake.current()
  }, [target, wind])

  useEffect(() => {
    const root = ref.current
    if (!root) return
    const reduced = window.matchMedia(REDUCED_MOTION_QUERY).matches
    const m = { pos: goal.current.target, vel: 0, sway: 0, swayVel: 0, wind: 0, t: 0 }
    let raf = 0
    let last = 0
    let curtains: HTMLElement[] = []

    const paint = (sway: number, flutter: number) => {
      root.toggleAttribute('data-curtain', m.pos > 0.002)
      for (const el of curtains) {
        el.style.setProperty('--sh-curtain', m.pos.toFixed(4))
        el.style.setProperty('--sh-sway', `${sway.toFixed(3)}deg`)
        el.style.setProperty('--sh-flutter', `${flutter.toFixed(3)}deg`)
      }
    }

    /** Physics in fixed small steps, so speed and swing stay true even when frames are slow. */
    const step = (dt: number, to: number, w: number) => {
      const prevVel = m.vel
      if (reduced) {
        m.pos = to
        m.vel = 0
      } else {
        const d = to - m.pos
        const dir = Math.sign(d)
        const braking = (m.vel * m.vel) / (2 * ACCEL)
        const want = Math.abs(d) <= braking + 1e-4 && Math.sign(m.vel) === dir ? 0 : dir * MAX_SPEED
        m.vel += Math.max(-ACCEL * dt, Math.min(ACCEL * dt, want - m.vel))
        m.pos += m.vel * dt
        // Arrived (or would pass the target this step): stop exactly there.
        if ((to - m.pos) * dir <= 0) {
          m.pos = to
          m.vel = 0
        }
      }
      const accel = (m.vel - prevVel) / dt
      // Fabric lags behind when the carrier speeds up and swings on when it stops…
      const swayAcc = -SWAY_STIFFNESS * m.sway - SWAY_DAMPING * m.swayVel - SWAY_GAIN * accel
      m.swayVel += swayAcc * dt
      m.sway += m.swayVel * dt
      m.wind += (w - m.wind) * (1 - Math.exp(-1.5 * dt))
      m.t += dt
    }

    const frame = (time: number) => {
      let left = Math.min(0.25, last ? (time - last) / 1000 : 1 / 60)
      last = time
      const { target: to, wind: w } = goal.current
      while (left > 1e-6) {
        const dt = Math.min(1 / 120, left)
        step(dt, to, w)
        left -= dt
      }
      // …and billows in the fan's wind (blowing left → right), more the stronger it is.
      const flutter = reduced
        ? 0
        : m.wind * (1.4 + 1.6 * Math.sin(m.t * 1.9) + 0.8 * Math.sin(m.t * 3.3 + 1.2) + 0.5 * Math.sin(m.t * 5.1 + 0.4))
      paint(reduced ? 0 : Math.max(-MAX_SWAY, Math.min(MAX_SWAY, m.sway)), flutter)

      const moving = Math.abs(to - m.pos) > 1e-4 || Math.abs(m.vel) > 1e-4
      const swinging = Math.abs(m.sway) > 0.01 || Math.abs(m.swayVel) > 0.01
      const blowing = m.pos > 0.002 && (m.wind > 0.002 || w > 0)
      raf = moving || swinging || blowing ? requestAnimationFrame(frame) : 0
      if (!raf) last = 0
    }

    wake.current = () => {
      curtains = [...root.querySelectorAll<HTMLElement>('[data-curtain-el]')]
      if (!raf) raf = requestAnimationFrame(frame)
    }
    wake.current()

    return () => {
      cancelAnimationFrame(raf)
      wake.current = () => {}
    }
  }, [ref])
}
