export type Point = [number, number]
export type Quad = [Point, Point, Point, Point]

/**
 * Where a pixel of an `object-fit: cover` image lands in its box (CSS px), for an image of
 * `natural` size shown in a `box` with `object-position: fx fy` (0–1).
 */
export function coverMapper(box: { width: number; height: number }, natural: Point, [fx, fy]: Point) {
  const scale = Math.max(box.width / natural[0], box.height / natural[1])
  const dx = (box.width - natural[0] * scale) * fx
  const dy = (box.height - natural[1] * scale) * fy
  return { scale, map: ([x, y]: Point): Point => [x * scale + dx, y * scale + dy] }
}

const fmt = (n: number) => Number(n.toFixed(7))

/**
 * CSS `matrix3d` that lays an element of `w` × `h` (transform-origin 0 0) onto a quadrilateral
 * (top-left, top-right, bottom-right, bottom-left): the projective map of the unit square
 * onto the quad (Heckbert), scaled to the element's own pixels.
 */
export function quadToMatrix3d(w: number, h: number, [[x0, y0], [x1, y1], [x2, y2], [x3, y3]]: Quad) {
  const dx1 = x1 - x2
  const dx2 = x3 - x2
  const dx3 = x0 - x1 + x2 - x3
  const dy1 = y1 - y2
  const dy2 = y3 - y2
  const dy3 = y0 - y1 + y2 - y3
  let g = 0
  let k = 0
  if (Math.abs(dx3) > 1e-9 || Math.abs(dy3) > 1e-9) {
    const det = dx1 * dy2 - dx2 * dy1
    g = (dx3 * dy2 - dx2 * dy3) / det
    k = (dx1 * dy3 - dx3 * dy1) / det
  }
  const a = x1 - x0 + g * x1
  const b = x3 - x0 + k * x3
  const d = y1 - y0 + g * y1
  const e = y3 - y0 + k * y3
  const m = [a / w, d / w, 0, g / w, b / h, e / h, 0, k / h, 0, 0, 1, 0, x0, y0, 0, 1]
  return `matrix3d(${m.map(fmt).join(', ')})`
}

const dist = ([ax, ay]: Point, [bx, by]: Point) => Math.hypot(bx - ax, by - ay)

/** Mean edge lengths of a quad: [width, height]. */
export const quadSize = ([tl, tr, br, bl]: Quad): Point => [
  (dist(tl, tr) + dist(bl, br)) / 2,
  (dist(tl, bl) + dist(tr, br)) / 2,
]
