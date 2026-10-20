/**
 * Air-conditioner style seven-segment read-out. Unlit segments stay faintly visible, like
 * a real LCD.
 */

type Segment = 'a' | 'b' | 'c' | 'd' | 'e' | 'f' | 'g'

const horizontal = (cy: number) => `12,${cy} 16,${cy - 4} 44,${cy - 4} 48,${cy} 44,${cy + 4} 16,${cy + 4}`
const vertical = (cx: number, y1: number, y2: number) =>
  `${cx},${y1} ${cx + 4},${y1 + 4} ${cx + 4},${y2 - 4} ${cx},${y2} ${cx - 4},${y2 - 4} ${cx - 4},${y1 + 4}`

const SEGMENTS: Record<Segment, string> = {
  a: horizontal(6),
  b: vertical(52, 9, 48),
  c: vertical(52, 52, 91),
  d: horizontal(94),
  e: vertical(8, 52, 91),
  f: vertical(8, 9, 48),
  g: horizontal(50),
}

const GLYPHS: Record<string, Segment[]> = {
  '0': ['a', 'b', 'c', 'd', 'e', 'f'],
  '1': ['b', 'c'],
  '2': ['a', 'b', 'g', 'e', 'd'],
  '3': ['a', 'b', 'g', 'c', 'd'],
  '4': ['f', 'g', 'b', 'c'],
  '5': ['a', 'f', 'g', 'c', 'd'],
  '6': ['a', 'f', 'g', 'e', 'd', 'c'],
  '7': ['a', 'b', 'c'],
  '8': ['a', 'b', 'c', 'd', 'e', 'f', 'g'],
  '9': ['a', 'b', 'c', 'd', 'f', 'g'],
  '-': ['g'],
}

const ORDER = Object.keys(SEGMENTS) as Segment[]

function Digit({ char }: { char: string }) {
  const lit = GLYPHS[char] ?? []
  return (
    <svg className="sh-seg__digit" viewBox="0 0 60 100" aria-hidden="true">
      <g transform="skewX(-6) translate(6 0)">
        {ORDER.map((s) => (
          <polygon key={s} points={SEGMENTS[s]} data-lit={lit.includes(s) || undefined} />
        ))}
      </g>
    </svg>
  )
}

export function SevenSegment({ value }: { value: string }) {
  return (
    <span className="sh-seg">
      {[...value].map((char, i) => (
        <Digit key={i} char={char} />
      ))}
    </span>
  )
}
