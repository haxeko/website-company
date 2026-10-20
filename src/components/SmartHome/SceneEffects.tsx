import { useEffect, useRef, useState } from 'react'
import { REDUCED_MOTION_QUERY } from '../../utils/device'

interface SceneEffectsProps {
  /** Snow density: 0 = air-con off, up to 1 at the coldest set point. */
  snow: number
  /**
   * Fan strength: 0 = off, up to 1. It blows leaves across and drives falling snow to the
   * right — faster the stronger it is.
   */
  wind: number
  /** Only while the Smart Home space is in the centre. */
  visible: boolean
}

interface Flake {
  x: number
  y: number
  r: number
  vy: number
  depth: number
  phase: number
  sway: number
  alpha: number
  /** The flake shows once the density passes this value (0–1). */
  gate: number
}

interface Leaf {
  x: number
  y: number
  size: number
  vx: number
  vy: number
  rot: number
  spin: number
  flip: number
  flipSpeed: number
  phase: number
  color: string
  alive: boolean
}

const LEAF_COLORS = ['#6f7c3a', '#8b8f44', '#a9873c', '#5d6a33', '#9c6a2e', '#7b8a46']
const MAX_DPR = 1.5

const rand = (a: number, b: number) => a + Math.random() * (b - a)
const clamp01 = (v: number) => Math.min(1, Math.max(0, v))
/** Frame-rate independent approach to a target. */
const approach = (value: number, target: number, rate: number, dt: number) =>
  value + (target - value) * (1 - Math.exp(-rate * dt))

function makeFlake(w: number, h: number, anywhere: boolean, gate = Math.random()): Flake {
  const depth = Math.random()
  return {
    x: rand(-20, w + 20),
    y: anywhere ? rand(-20, h) : rand(-60, -10),
    r: 0.8 + depth * 2.2,
    vy: 16 + depth * 34,
    depth,
    phase: rand(0, Math.PI * 2),
    sway: rand(6, 18),
    alpha: 0.22 + depth * 0.45,
    gate,
  }
}

function spawnLeaf(leaf: Partial<Leaf>, w: number, h: number, stagger: number): Leaf {
  const size = rand(8, 16) * Math.min(1.4, Math.max(0.75, w / 1440))
  return Object.assign(leaf, {
    x: -40 - Math.random() * stagger,
    y: rand(h * 0.08, h * 0.82),
    size,
    vx: rand(200, 360) * (w < 700 ? 0.7 : 1),
    vy: rand(-30, 40),
    rot: rand(0, Math.PI * 2),
    spin: rand(-4, 4),
    flip: 0,
    flipSpeed: rand(3, 7),
    phase: rand(0, Math.PI * 2),
    color: LEAF_COLORS[Math.floor(Math.random() * LEAF_COLORS.length)],
    alive: true,
  }) as Leaf
}

function softDot() {
  const c = document.createElement('canvas')
  c.width = c.height = 32
  const g = c.getContext('2d')!
  const grad = g.createRadialGradient(16, 16, 0, 16, 16, 16)
  grad.addColorStop(0, 'rgba(255,255,255,1)')
  grad.addColorStop(0.35, 'rgba(240,248,255,0.75)')
  grad.addColorStop(1, 'rgba(230,242,255,0)')
  g.fillStyle = grad
  g.fillRect(0, 0, 32, 32)
  return c
}

function drawLeaf(ctx: CanvasRenderingContext2D, leaf: Leaf, alpha: number) {
  const s = leaf.size
  ctx.save()
  ctx.translate(leaf.x, leaf.y)
  ctx.rotate(leaf.rot)
  // Tumbling: squash one axis as the leaf turns over.
  ctx.scale(1, 0.25 + 0.75 * Math.abs(leaf.flip))
  ctx.globalAlpha = alpha
  ctx.beginPath()
  ctx.moveTo(-s, 0)
  ctx.quadraticCurveTo(-s * 0.15, -s * 0.62, s, 0)
  ctx.quadraticCurveTo(-s * 0.15, s * 0.62, -s, 0)
  ctx.fillStyle = leaf.color
  ctx.fill()
  ctx.globalAlpha = alpha * 0.45
  ctx.strokeStyle = '#2f3318'
  ctx.lineWidth = Math.max(0.6, s * 0.07)
  ctx.beginPath()
  ctx.moveTo(-s * 1.25, 0)
  ctx.lineTo(s * 0.85, 0)
  ctx.stroke()
  ctx.restore()
}

/**
 * Weather in the room, drawn on one canvas over the panorama: snowflakes while the air-con
 * runs (denser the colder it is set), leaves blowing across and snow driven sideways while
 * the fan blows (faster the stronger it is). Nothing runs while every effect is off; reduced-motion
 * visitors only see the control screen change.
 */
export function SceneEffects({ snow, wind, visible }: SceneEffectsProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const target = useRef({ snow: 0, wind: 0, leaves: false })
  const wake = useRef<() => void>(() => {})
  const [reduced] = useState(() => window.matchMedia(REDUCED_MOTION_QUERY).matches)

  useEffect(() => {
    target.current = {
      snow: visible ? snow : 0,
      wind: visible ? wind : 0,
      leaves: visible && wind > 0,
    }
    wake.current()
  }, [snow, wind, visible])

  useEffect(() => {
    const canvas = canvasRef.current
    if (reduced || !canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const dot = softDot()

    let w = 0
    let h = 0
    let dpr = 1
    let flakes: Flake[] = []
    let leaves: Leaf[] = []
    // Eased copies of the targets: density, and fan strength.
    const level = { snow: 0, wind: 0 }
    let raf = 0
    let last = 0

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR)
      w = canvas.clientWidth
      h = canvas.clientHeight
      canvas.width = Math.round(w * dpr)
      canvas.height = Math.round(h * dpr)
      // Enough flakes for the coldest setting; warmer settings show only part of them.
      const count = Math.round(Math.min(280, Math.max(90, (w * h) / 6500)))
      flakes = Array.from({ length: count }, (_, i) => makeFlake(w, h, true, (i + Math.random()) / count))
      const leafCount = w < 700 ? 9 : 18
      leaves = Array.from({ length: leafCount }, () => ({ alive: false }) as Leaf)
    }

    const frame = (time: number) => {
      const dt = Math.min(0.05, last ? (time - last) / 1000 : 0.016)
      last = time
      const t = time / 1000
      const goal = target.current
      level.snow = approach(level.snow, goal.snow, 1.8, dt)
      level.wind = approach(level.wind, goal.wind, 1.4, dt)
      const breeze = clamp01(level.wind * 3)

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.clearRect(0, 0, w, h)

      if (level.snow > 0.004) {
        for (const f of flakes) {
          const gust = (160 + f.depth * 240) * level.wind * 1.6
          f.x += (gust + Math.sin(t * 0.8 + f.phase) * f.sway * (1 - breeze)) * dt
          f.y += f.vy * (1 - 0.35 * breeze) * dt
          if (f.y > h + 12) Object.assign(f, makeFlake(w, h, false, f.gate))
          if (f.x > w + 20) {
            f.x = rand(-60, -20)
            f.y = rand(-20, h)
          } else if (f.x < -30) f.x = w + 20
          // Fade in / out around the density threshold instead of popping.
          const show = clamp01((level.snow - f.gate) / 0.06)
          if (show <= 0) continue
          const size = f.r * 4
          ctx.globalAlpha = f.alpha * show
          ctx.drawImage(dot, f.x - size / 2, f.y - size / 2, size, size)
        }
      }

      // Leaves fly faster the stronger the fan; when it stops they lose speed and drop.
      const speed = 0.4 + 1.5 * level.wind
      let leavesAlive = false
      for (const leaf of leaves) {
        if (!leaf.alive) {
          if (goal.leaves) spawnLeaf(leaf, w, h, w * 0.9)
          else continue
        }
        if (!goal.leaves) leaf.vy = Math.min(leaf.vy + 320 * dt, 280)
        leaf.x += leaf.vx * Math.max(speed, 0.3) * dt
        leaf.y += (leaf.vy + Math.sin(t * (1.2 + speed) + leaf.phase) * (28 + 30 * level.wind)) * dt
        leaf.rot += leaf.spin * speed * dt
        leaf.flip = Math.cos(t * leaf.flipSpeed * (0.6 + 0.5 * speed) + leaf.phase)
        if (leaf.x > w + 50 || leaf.y > h + 50 || leaf.y < -50) {
          if (goal.leaves) spawnLeaf(leaf, w, h, 260)
          else {
            leaf.alive = false
            continue
          }
        }
        leavesAlive = true
        drawLeaf(ctx, leaf, 0.92)
      }
      ctx.globalAlpha = 1

      const busy = leavesAlive || goal.snow > 0 || level.snow > 0.004
      raf = busy ? requestAnimationFrame(frame) : 0
      if (!busy) {
        last = 0
        ctx.clearRect(0, 0, w, h)
      }
    }

    wake.current = () => {
      if (!raf) raf = requestAnimationFrame(frame)
    }

    resize()
    const observer = new ResizeObserver(resize)
    observer.observe(canvas)
    wake.current()

    return () => {
      cancelAnimationFrame(raf)
      observer.disconnect()
      wake.current = () => {}
    }
  }, [reduced])

  if (reduced) return null
  return <canvas ref={canvasRef} className="sh-effects" aria-hidden="true" />
}
