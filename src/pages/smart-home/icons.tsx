import type { ReactNode } from 'react'

/** Line icons on a 24 × 24 grid, drawn in the text colour. */
function Svg({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      {children}
    </svg>
  )
}

type IconProps = { className?: string }

/* ── Standards and platforms (simple marks, not the official logos) ───────── */

export const MatterIcon = ({ className }: IconProps) => (
  <Svg className={className}>
    <path d="M12 2.8v6.4M12 9.2l-3.2-2.4M12 9.2l3.2-2.4" />
    <path d="M4 18.2l5.5-3.2M9.5 15l-.5 4M9.5 15l-3.7-1.6" />
    <path d="M20 18.2l-5.5-3.2M14.5 15l.5 4M14.5 15l3.7-1.6" />
  </Svg>
)

export const ZigbeeIcon = ({ className }: IconProps) => (
  <Svg className={className}>
    <circle cx="12" cy="12" r="9.2" />
    <path d="M7.6 8.2h8.4l-8 7.6h8.4" />
  </Svg>
)

export const ThreadIcon = ({ className }: IconProps) => (
  <Svg className={className}>
    <circle cx="12" cy="12" r="9.2" />
    <path d="M12 21.2V9.5a2.7 2.7 0 1 1 2.7 2.7H6.8" />
  </Svg>
)

export const WifiIcon = ({ className }: IconProps) => (
  <Svg className={className}>
    <path d="M2.8 9.2a13.5 13.5 0 0 1 18.4 0M5.9 12.6a9 9 0 0 1 12.2 0M9 16a4.6 4.6 0 0 1 6 0" />
    <circle cx="12" cy="19.2" r="0.9" />
  </Svg>
)

export const HomeAssistantIcon = ({ className }: IconProps) => (
  <Svg className={className}>
    <path d="M3.5 11 12 3.4l8.5 7.6v9.6h-17z" />
    <path d="M12 20.6v-8.4M12 15.6l-3-3M12 13.8l3-3" />
    <circle cx="9" cy="12.4" r="1" />
    <circle cx="15" cy="10.6" r="1" />
  </Svg>
)

export const HomeKitIcon = ({ className }: IconProps) => (
  <Svg className={className}>
    <path d="M3.4 11.2 12 3.6l8.6 7.6M5.8 9.2v11.2h12.4V9.2" />
  </Svg>
)

const PROTOCOLS = [MatterIcon, ZigbeeIcon, ThreadIcon, WifiIcon, HomeAssistantIcon, HomeKitIcon]

/** Matter, Zigbee, Thread, Wi-Fi, Home Assistant, HomeKit — in the order of the page copy. */
export function ProtocolIcon({ index, className }: IconProps & { index: number }) {
  const Icon = PROTOCOLS[index]
  return <Icon className={className} />
}

/* ── Panel ─────────────────────────────────────────────────────────────── */

export const HomeIcon = ({ className }: IconProps) => (
  <Svg className={className}>
    <path className="is-filled" d="M3.5 11.2 12 3.8l8.5 7.4v9.3h-5.6v-5.8H9.1v5.8H3.5z" />
  </Svg>
)

export const ScenesIcon = ({ className }: IconProps) => (
  <Svg className={className}>
    <rect x="4" y="4" width="6.6" height="6.6" rx="1.4" />
    <rect x="13.4" y="4" width="6.6" height="6.6" rx="1.4" />
    <rect x="4" y="13.4" width="6.6" height="6.6" rx="1.4" />
    <rect x="13.4" y="13.4" width="6.6" height="6.6" rx="1.4" />
  </Svg>
)

export const LeafIcon = ({ className }: IconProps) => (
  <Svg className={className}>
    <path d="M5 19.5C4.2 11 9 5 19.6 4.4 20 14.6 14 19.8 5 19.5Z" />
    <path d="M5 19.5c3.6-4.4 6.8-7.4 10.4-9.6" />
  </Svg>
)

export const ShieldIcon = ({ className }: IconProps) => (
  <Svg className={className}>
    <path d="M12 3.2 19 6v5.4c0 4.5-2.9 8-7 9.4-4.1-1.4-7-4.9-7-9.4V6z" />
    <path d="M12 9.4v3.4M12 15.6v.1" />
  </Svg>
)

export const GearIcon = ({ className }: IconProps) => (
  <Svg className={className}>
    <circle cx="12" cy="12" r="3" />
    <path d="M12 2.8v2.6M12 18.6v2.6M21.2 12h-2.6M5.4 12H2.8M18.5 5.5l-1.8 1.8M7.3 16.7l-1.8 1.8M18.5 18.5l-1.8-1.8M7.3 7.3 5.5 5.5" />
    <circle cx="12" cy="12" r="6.4" />
  </Svg>
)

export const BulbIcon = ({ className }: IconProps) => (
  <Svg className={className}>
    <path
      className="is-filled"
      d="M12 3a6.2 6.2 0 0 0-3.7 11.2c.7.5 1.1 1.3 1.1 2.2v.6h5.2v-.6c0-.9.4-1.7 1.1-2.2A6.2 6.2 0 0 0 12 3Z"
    />
    <path d="M9.6 19.4h4.8M10.4 21.4h3.2" />
  </Svg>
)

export const CurtainIcon = ({ className }: IconProps) => (
  <Svg className={className}>
    <path d="M3 3.6h18" />
    <path d="M5.4 3.6v16.6c1.7.8 3.4.8 5.1 0-1.4-5.4-1.4-11 0-16.6M18.6 3.6v16.6c-1.7.8-3.4.8-5.1 0 1.4-5.4 1.4-11 0-16.6" />
  </Svg>
)

export const AirConIcon = ({ className }: IconProps) => (
  <Svg className={className}>
    <rect x="3" y="5" width="18" height="8.6" rx="1.6" />
    <path d="M6.4 10.6h11.2M8 16.4l-1 2.6M12 16.4V19M16 16.4l1 2.6" />
  </Svg>
)

export const MoonIcon = ({ className }: IconProps) => (
  <Svg className={className}>
    <path className="is-filled" d="M15.4 3.6a8.6 8.6 0 1 0 5 13.6A7.4 7.4 0 0 1 15.4 3.6Z" />
  </Svg>
)

export const WeatherIcon = ({ className }: IconProps) => (
  <Svg className={className}>
    <circle className="is-sun" cx="15.6" cy="8" r="3.6" />
    <path
      className="is-filled"
      d="M7.2 20.4a4.2 4.2 0 0 1-.4-8.4 5.4 5.4 0 0 1 10.3 1.5 3.5 3.5 0 0 1-.5 6.9z"
    />
  </Svg>
)

/* ── Page ──────────────────────────────────────────────────────────────── */

export const ArrowIcon = ({ className }: IconProps) => (
  <Svg className={className}>
    <path d="M7 17 17 7M9 7h8v8" />
  </Svg>
)

export const PlayIcon = ({ className }: IconProps) => (
  <Svg className={className}>
    <path className="is-filled" d="M9 7.2v9.6l7.4-4.8z" />
  </Svg>
)

export const StopIcon = ({ className }: IconProps) => (
  <Svg className={className}>
    <rect className="is-filled" x="8" y="8" width="8" height="8" rx="1" />
  </Svg>
)

export const LockIcon = ({ className }: IconProps) => (
  <Svg className={className}>
    <rect x="5" y="10.4" width="14" height="10" rx="2" />
    <path d="M8.4 10.4V7.6a3.6 3.6 0 0 1 7.2 0v2.8" />
  </Svg>
)

export const CameraIcon = ({ className }: IconProps) => (
  <Svg className={className}>
    <rect x="3" y="7" width="13" height="10" rx="2" />
    <path d="m16 10.6 5-3v8.8l-5-3" />
  </Svg>
)

export const SensorIcon = ({ className }: IconProps) => (
  <Svg className={className}>
    <circle cx="12" cy="12" r="2.4" />
    <path d="M7.8 7.8a6 6 0 0 0 0 8.4M16.2 7.8a6 6 0 0 1 0 8.4M5 5a10 10 0 0 0 0 14M19 5a10 10 0 0 1 0 14" />
  </Svg>
)

export const SunIcon = ({ className }: IconProps) => (
  <Svg className={className}>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2.6v2.2M12 19.2v2.2M21.4 12h-2.2M4.8 12H2.6M18.6 5.4l-1.5 1.5M6.9 17.1l-1.5 1.5M18.6 18.6l-1.5-1.5M6.9 6.9 5.4 5.4" />
  </Svg>
)

export const MeterIcon = ({ className }: IconProps) => (
  <Svg className={className}>
    <path d="M4 18a8 8 0 1 1 16 0" />
    <path d="M12 18l4-5.6" />
    <path d="M4 18h16" />
  </Svg>
)

export const PersonIcon = ({ className }: IconProps) => (
  <Svg className={className}>
    <circle cx="12" cy="7.6" r="3.6" />
    <path d="M4.6 20.6a7.4 7.4 0 0 1 14.8 0" />
  </Svg>
)
