import { useEffect, useRef, useState } from 'react'
import { REDUCED_MOTION_QUERY } from '../../utils/device'

interface SceneEffectsProps {
  /** Air-con on: soft snowflakes drift down. */
  snow: boolean
  /** Fan on: leaves blow across — or, with the air-con on, the snow is blown to the right. */
  wind: boolean
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
/** Frame-rate independent approach to a target. */
const approach = (value: number, target: number, rate: number, dt: number) =>
  value + (target - value) * (1 - Math.exp(-rate * dt))

function makeFlake(w: number, h: number, anywhere: boolean): Flake {
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
  }
}

function spawnLeaf(leaf: Partial<Leaf>, w: number, h: number, stagger: number): Leaf {
  const size = rand(8, 16) * Math.min(1.4, Math.max(0.75, w / 1440))
  return Object.assign(leaf, {
    x: -40 - Math.random() * stagger,
    y: rand(h * 0.08, h * 0.82),
    size,
    vx: rand(260, 480) * (w < 700 ? 0.7 : 1),
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
 * runs, leaves (or snow driven sideways) while the fan blows. Nothing runs while every
 * effect is off; reduced-motion visitors only see the control screen change.
 */
export function SceneEffects({ snow, wind, visible }: SceneEffectsProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const target = useRef({ snow: 0, wind: 0, leaves: 0 })
  const wake = useRef<() => void>(() => {})
  const [reduced] = useState(() => window.matchMedia(REDUCED_MOTION_QUERY).matches)

  useEffect(() => {
    target.current = {
      snow: visible && snow ? 1 : 0,
      wind: visible && wind ? 1 : 0,
      leaves: visible && wind && !snow ? 1 : 0,
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
    const level = { snow: 0, wind: 0 }
    let raf = 0
    let last = 0

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR)
      w = canvas.clientWidth
      h = canvas.clientHeight
      canvas.width = Math.round(w * dpr)
      canvas.height = Math.round(h * dpr)
      const count = Math.round(Math.min(140, Math.max(40, (w * h) / 13000)))
      flakes = Array.from({ length: count }, () => makeFlake(w, h, true))
      const leafCount = w < 700 ? 9 : 18
      leaves = Array.from({ length: leafCount }, () => ({ alive: false }) as Leaf)
    }

    const frame = (time: number) => {
      const dt = Math.min(0.05, last ? (time - last) / 1000 : 0.016)
      last = time
      const t = time / 1000
      const goal = target.current
      level.snow = approach(level.snow, goal.snow, 2.2, dt)
      level.wind = approach(level.wind, goal.wind, 1.6, dt)

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.clearRect(0, 0, w, h)

      if (level.snow > 0.004) {
        for (const f of flakes) {
          const gust = level.wind * (200 + f.depth * 280)
          f.x += (gust + Math.sin(t * 0.8 + f.phase) * f.sway * (1 - level.wind)) * dt
          f.y += f.vy * (1 - 0.4 * level.wind) * dt
          if (f.y > h + 12) Object.assign(f, makeFlake(w, h, false))
          if (f.x > w + 20) {
            f.x = rand(-60, -20)
            f.y = rand(-20, h)
          } else if (f.x < -30) f.x = w + 20
          const size = f.r * 4
          ctx.globalAlpha = f.alpha * level.snow
          ctx.drawImage(dot, f.x - size / 2, f.y - size / 2, size, size)
        }
      }

      let leavesAlive = false
      for (const leaf of leaves) {
        if (!leaf.alive) {
          if (goal.leaves) spawnLeaf(leaf, w, h, w * 0.9)
          else continue
        }
        leaf.x += leaf.vx * dt
        leaf.y += (leaf.vy + Math.sin(t * 1.7 + leaf.phase) * 46) * dt
        leaf.rot += leaf.spin * dt
        leaf.flip = Math.cos(t * leaf.flipSpeed + leaf.phase)
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
