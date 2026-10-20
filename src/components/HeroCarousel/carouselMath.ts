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

/** Panels further than this (in panel units) from the centre are off-screen and not rendered. */
export const VISIBLE_RANGE = 2.4

export interface VisualParams {
  /** Width of one panel's own share of the panorama, px. */
  pitch: number
  /** Angle between neighbouring panels, radians. */
  angle: number
  sideOpacity: number
  sideBlur: number
  sideBrightness: number
  hoverBrighten: number
  hoverUnblur: number
}

export interface SlideVisual {
  x: number
  z: number
  rotateY: number
  opacity: number
  blur: number
  brightness: number
  zIndex: number
  visible: boolean
}

/**
 * Panels sit on a regular polygon seen from the inside (a gently curved wall). Rotating the
 * polygon moves every panel together, so neighbouring panels stay hinged at their shared
 * edge at every frame: the end of one image always meets the start of the next.
 * offset 0 → CENTER, -1 → LEFT, +1 → RIGHT.
 */
export function computeSlideVisual(offset: number, hover: number, p: VisualParams): SlideVisual {
  const distance = Math.abs(offset)
  const t = Math.min(distance, 1)
  const hoverWeight = hover * (1 - smoothstep(0, 0.45, Math.abs(distance - 1)))

  let x = offset * p.pitch
  let z = 0
  const theta = offset * p.angle
  if (p.angle > 1e-4) {
    const apothem = p.pitch / (2 * Math.tan(p.angle / 2))
    x = apothem * Math.sin(theta)
    z = apothem * (1 - Math.cos(theta))
  }

  return {
    x,
    z,
    rotateY: (-theta * 180) / Math.PI,
    opacity: lerp(1, p.sideOpacity, t),
    blur: p.sideBlur > 0 ? Math.max(0, p.sideBlur * Math.min(distance, 1.6) ** 1.2 - p.hoverUnblur * hoverWeight) : 0,
    brightness:
      lerp(1, p.sideBrightness, smoothstep(0, 1, t)) * (1 - 0.25 * clamp(distance - 1, 0, 1)) +
      p.hoverBrighten * hoverWeight,
    // The panel to the right is always on top: its seam fades in over its left neighbour.
    zIndex: Math.round(100 + offset * 10),
    visible: distance < VISIBLE_RANGE,
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

/**
 * Horizontal mask of a panel: its left strip (the part it shares with the panel on its left)
 * fades in from transparent, so the two images cross-fade into each other; the right edge
 * stays opaque under the next panel's fade (a hair of feathering hides any sub-pixel edge).
 * `seamFraction` is the shared strip as a fraction of the element width.
 */
export function seamGradient(seamFraction: number): string {
  const f = seamFraction * 100
  const tail = Math.max(0.15, f * 0.08)
  return `linear-gradient(to right, ${[...ramp(0, f, 0, 1, 10), ...ramp(100 - tail, 100, 1, 0, 2)].join(', ')})`
}

export interface FeatherSizes {
  /** Fade at the top, % of the slide height. */
  top: number
  /** Fade at the bottom, % of the slide height. */
  bottom: number
}

/** Maps the single `fadeStrength` setting (0–1) to the fade widths of each edge. */
export function featherSizes(strength: number): FeatherSizes {
  const s = clamp(strength, 0, 1)
  return { top: 3 + 18 * s, bottom: 3 + 14 * s }
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
