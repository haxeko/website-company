/**
 * Pure maths for the hero carousel: no DOM, no GSAP.
 *
 * The carousel is driven by one continuous number, `progress` (the index currently in the
 * centre, unbounded: …, -1, 0, 1, 2, 3, …). Every slide's look is a function of its signed
 * distance from the centre, wrapped around the ring. A slide only ever changes sides while
 * it is fully transparent (at ±count/2), which is what makes the infinite loop seamless.
 */

export const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t
export const mod = (n: number, m: number) => ((n % m) + m) % m

export const smoothstep = (edge0: number, edge1: number, x: number) => {
  const t = clamp((x - edge0) / (edge1 - edge0), 0, 1)
  return t * t * (3 - 2 * t)
}

const easeInOutSine = (t: number) => (1 - Math.cos(Math.PI * t)) / 2

/** Signed distance of slide `index` from the centre, wrapped into [-count/2, count/2). */
export const wrapOffset = (index: number, progress: number, count: number) =>
  mod(index - progress + count / 2, count) - count / 2

/** Distance (in slide units) beyond the side position over which a slide fades out before it wraps. */
const EXIT_ZONE = 0.5

export interface VisualParams {
  /** px between the centre and a side slide. */
  spacing: number
  /** Extra px a slide travels outwards while it fades out at the back. */
  exitDistance: number
  slideHeight: number
  sideScale: number
  sideRotate: number
  sideOpacity: number
  sideBlur: number
  sideBrightness: number
  floorAlign: number
  innerParallax: number
  hoverNudge: number
  hoverBrighten: number
  hoverUnblur: number
}

export interface SlideVisual {
  x: number
  y: number
  rotateY: number
  scale: number
  opacity: number
  blur: number
  brightness: number
  zIndex: number
  /** Scale of the image inside its frame. */
  innerScale: number
  /** Horizontal drift of the image inside its frame, in % of the frame width. */
  innerShift: number
}

/**
 * offset 0 → CENTER, -1 → LEFT, +1 → RIGHT, beyond ±1 → fading out at the back.
 * `hover` (0–1) lets a hovered side slide lean slightly towards the centre and brighten.
 */
export function computeSlideVisual(offset: number, hover: number, p: VisualParams): SlideVisual {
  const dir = offset < 0 ? -1 : 1
  const distance = Math.abs(offset)
  const hoverWeight = hover * (1 - smoothstep(0, 0.4, Math.abs(distance - 1)))
  const a = Math.max(0, distance - p.hoverNudge * hoverWeight)

  const t = Math.min(a, 1) // centre → side
  const u = clamp((a - 1) / EXIT_ZONE, 0, 1) // side → gone
  const scale = lerp(1, p.sideScale, t) * (1 - 0.12 * u)
  const blurBase = p.sideBlur > 0 ? p.sideBlur * t ** 1.25 + 4 * u : 0

  return {
    x: dir * (p.spacing * t + p.exitDistance * u),
    y: (1 - scale) * p.slideHeight * 0.5 * p.floorAlign,
    rotateY: -dir * (p.sideRotate * t + 6 * u),
    scale,
    // Fully transparent for the last 15% before the wrap point, so even a fast chained move
    // never shows a slide jumping from one side to the other.
    opacity: lerp(1, p.sideOpacity, t) * (1 - smoothstep(0, 0.85, u)),
    blur: Math.max(0, blurBase - p.hoverUnblur * hoverWeight),
    brightness: lerp(1, p.sideBrightness, smoothstep(0, 1, t)) * (1 - 0.3 * u) + p.hoverBrighten * hoverWeight,
    zIndex: Math.round(40 - a * 10),
    innerScale: 1 + (p.innerParallax > 0 ? 2 * p.innerParallax + 0.02 : 0) * t,
    innerShift: -dir * p.innerParallax * t * 100,
  }
}

/* ── Borderless masks ─────────────────────────────────────────────────────── */

const round = (n: number, digits: number) => Number(n.toFixed(digits))

/** Eased alpha ramp between two positions (in %), so the fade has no visible edge. */
function ramp(from: number, to: number, alphaFrom: number, alphaTo: number, steps = 7): string[] {
  const stops: string[] = []
  for (let i = 0; i <= steps; i++) {
    const k = i / steps
    const alpha = lerp(alphaFrom, alphaTo, easeInOutSine(k))
    stops.push(`rgba(0,0,0,${round(alpha, 3)}) ${round(lerp(from, to, k), 2)}%`)
  }
  return stops
}

/** A gradient that is opaque in the middle and fades to transparent at both ends. */
export function featherGradient(direction: 'right' | 'bottom', start: number, end: number): string {
  return `linear-gradient(to ${direction}, ${[...ramp(0, start, 0, 1), ...ramp(100 - end, 100, 1, 0)].join(', ')})`
}

export interface FeatherSizes {
  /** Horizontal fade on each side, % of the slide width. */
  x: number
  /** Fade at the top, % of the slide height. */
  top: number
  /** Fade at the bottom, % of the slide height. */
  bottom: number
}

/** Maps the single `fadeStrength` setting (0–1) to the fade widths of each edge. */
export function featherSizes(strength: number): FeatherSizes {
  const s = clamp(strength, 0, 1)
  return { x: 4 + 22 * s, top: 3 + 18 * s, bottom: 3 + 14 * s }
}

/**
 * Vertical mask of the floor reflection. It mirrors the slide's own bottom fade (so the
 * reflection starts transparent right under the slide) and then falls off with distance.
 */
export function reflectionGradient(bottomFade: number, height: number): string {
  const rise = clamp(bottomFade / 100 / height, 0.05, 0.9)
  const steps = 14
  const stops: string[] = []
  for (let i = 0; i <= steps; i++) {
    const k = i / steps
    const alpha = easeInOutSine(clamp(k / rise, 0, 1)) * (1 - k) ** 1.6
    stops.push(`rgba(0,0,0,${round(alpha, 3)}) ${round(k * 100, 2)}%`)
  }
  return `linear-gradient(to bottom, ${stops.join(', ')})`
}
