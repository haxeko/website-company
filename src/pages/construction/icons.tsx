import type { ReactNode } from 'react'

/** Line icons on a 24 × 24 grid, drawn in the text colour. */
function Svg({ children }: { children: ReactNode }) {
  return (
    <svg className="cp-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      {children}
    </svg>
  )
}

/** An isometric block: the BIM model. */
const BimIcon = () => (
  <Svg>
    <path d="M12 3 20 7.5v9L12 21l-8-4.5v-9z" />
    <path d="M4 7.5 12 12l8-4.5M12 12v9" />
    <path d="M8 5.25 16 9.75" opacity="0.5" />
  </Svg>
)

/** The ground in layers, a bore down through them. */
const SoilIcon = () => (
  <Svg>
    <path d="M3 8h18M3 13h18M3 18h18" />
    <path d="M12 3v15.5" />
    <path d="m10 16.5 2 3 2-3" />
  </Svg>
)

/** A concrete test cylinder. */
const ConcreteIcon = () => (
  <Svg>
    <ellipse cx="12" cy="6" rx="6" ry="2.4" />
    <path d="M6 6v12c0 1.3 2.7 2.4 6 2.4s6-1.1 6-2.4V6" />
    <path d="M9 11.5h1M13.5 14h1M10.5 16.5h1" />
  </Svg>
)

/** Two ribbed reinforcing bars. */
const SteelIcon = () => (
  <Svg>
    <path d="M5 20 19 6M8 21 21 8" />
    <path d="m7 15.5 2.5 2.5M10 12.5l2.5 2.5M13 9.5l2.5 2.5M16 6.5 18.5 9" />
  </Svg>
)

/** A site camera on its arm. */
const CameraIcon = () => (
  <Svg>
    <path d="M3.5 9.5 15 5.5l2 5.6-11.5 4z" />
    <path d="m17 9 3.5-1.2M6 15.5 7 19H3.5" />
    <circle cx="9.6" cy="10" r="0.6" className="is-filled" />
  </Svg>
)

/** A shield with a tick. */
const WarrantyIcon = () => (
  <Svg>
    <path d="M12 3 19 6v5.5c0 4.3-3 7.7-7 9.5-4-1.8-7-5.2-7-9.5V6z" />
    <path d="m8.8 12 2.2 2.2 4.4-4.6" />
  </Svg>
)

const STRIP = [BimIcon, SoilIcon, ConcreteIcon, SteelIcon, CameraIcon, WarrantyIcon]

/** The strip's icons, in the order of the page copy. */
export function StripIcon({ index }: { index: number }) {
  const Icon = STRIP[index]
  return <Icon />
}

export const TickIcon = () => (
  <Svg>
    <path d="m6 12.5 4 4 8-9" />
  </Svg>
)

export const KeyIcon = () => (
  <Svg>
    <circle cx="8" cy="15" r="4.2" />
    <path d="m11 12 8.5-8.5M16 7l2.5 2.5M14 9l2 2" />
  </Svg>
)
