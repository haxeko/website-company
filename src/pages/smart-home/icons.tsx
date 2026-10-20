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

/* ── Standards and platforms: the official marks, in one colour ─────────────
 * Matter (SVG Logos, CC0), Zigbee and Home Assistant (Simple Icons, CC0), Wi-Fi (Material
 * Symbols, Apache 2.0), Thread and Apple HomeKit (selfh.st/icons, CC BY 4.0). The marks are
 * trademarks of their owners (CSA, Thread Group, Wi-Fi Alliance, Home Assistant, Apple).
 */

function Mark({ children, className, viewBox }: { children: ReactNode; className?: string; viewBox: string }) {
  return (
    <svg className={`is-mark ${className ?? ''}`} viewBox={viewBox} aria-hidden="true" focusable="false">
      {children}
    </svg>
  )
}

export const MatterIcon = ({ className }: IconProps) => (
  <Mark className={className} viewBox="0 0 256 251">
    <path d="M76.02 64.287a82.3 82.3 0 0 0 37.215 17.077V8.556L128.064 0l14.816 8.556v72.808a82.4 82.4 0 0 0 37.228-17.077l26.92 15.57c-43.782 43.316-114.274 43.316-158.056 0zm32.717 185.928C124.35 190.623 89.072 129.57 29.645 113.34v31.152a82.4 82.4 0 0 1 33.413 23.686L0 204.582v17.124l14.828 8.51l63.047-36.404a82.3 82.3 0 0 1 3.814 40.774zM226.413 113.34c-59.395 16.266-94.634 77.305-79.023 136.875l26.979-15.582a82.4 82.4 0 0 1 3.814-40.775l63 36.358L256 221.66v-17.078l-63.058-36.404a82.5 82.5 0 0 1 33.413-23.686z" />
  </Mark>
)

export const ZigbeeIcon = ({ className }: IconProps) => (
  <Mark className={className} viewBox="0 0 24 24">
    <path d="M11.988 0a11.85 11.85 0 0 0-8.617 3.696c7.02-.875 11.401-.583 13.289-.34c3.752.583 3.558 3.404 3.558 3.404L8.237 19.112c2.299.22 6.897.366 13.796-.631a11.86 11.86 0 0 0 1.912-6.469C23.945 5.374 18.595 0 11.988 0m.232 4.31c-2.451-.014-5.772.146-9.963.723C.854 7.003.055 9.41.055 12.012C.055 18.626 5.38 24 11.988 24c3.63 0 6.85-1.63 9.053-4.182c-7.286.948-11.813.631-13.75.388c-3.775-.56-3.557-3.404-3.557-3.404L15.691 4.474a39 39 0 0 0-3.471-.163Z" />
  </Mark>
)

export const ThreadIcon = ({ className }: IconProps) => (
  <Mark className={className} viewBox="0 0 512 512">
    <path d="M256 0C114.8 0 0 114.9 0 256c0 140.2 113.3 254.4 253.1 256V256.3h-83.8c-24.9 0-45.2 20.3-45.2 45.2s20.3 45.2 45.2 45.2v55.8c-55.7 0-101-45.3-101-100.9c0-55.7 45.3-101 101-101h83.8v-28.2c0-46.3 37.7-84 84-84s84 37.7 84 84s-37.7 84-84 84h-28.2v250.2C424.8 482 512 379 512 256C512 114.9 397.2 0 256 0m109.4 172.2c0-15.6-12.7-28.2-28.2-28.2c-15.6 0-28.2 12.7-28.2 28.2v28.2h28.2c15.5.1 28.2-12.6 28.2-28.2" />
  </Mark>
)

export const WifiIcon = ({ className }: IconProps) => (
  <Mark className={className} viewBox="0 0 24 24">
    <path d="M10.225 20.275Q9.5 19.55 9.5 18.5t.725-1.775T12 16t1.775.725t.725 1.775t-.725 1.775T12 21t-1.775-.725M6.35 15.35l-2.1-2.15q1.475-1.475 3.463-2.337T12 10t4.288.875t3.462 2.375l-2.1 2.1q-1.1-1.1-2.55-1.725T12 13t-3.1.625t-2.55 1.725M2.1 11.1L0 9q2.3-2.35 5.375-3.675T12 4t6.625 1.325T24 9l-2.1 2.1q-1.925-1.925-4.462-3.012T12 7T6.563 8.088T2.1 11.1" />
  </Mark>
)

export const HomeAssistantIcon = ({ className }: IconProps) => (
  <Mark className={className} viewBox="0 0 24 24">
    <path d="M22.939 10.627L13.061.749a1.505 1.505 0 0 0-2.121 0l-9.879 9.878C.478 11.21 0 12.363 0 13.187v9c0 .826.675 1.5 1.5 1.5h9.227l-4.063-4.062a2 2 0 0 1-.664.113c-1.13 0-2.05-.92-2.05-2.05s.92-2.05 2.05-2.05s2.05.92 2.05 2.05c0 .233-.041.456-.113.665l3.163 3.163V9.928a2.05 2.05 0 0 1-1.15-1.84c0-1.13.92-2.05 2.05-2.05s2.05.92 2.05 2.05a2.05 2.05 0 0 1-1.15 1.84v8.127l3.146-3.146A2.05 2.05 0 0 1 18 12.239c1.13 0 2.05.92 2.05 2.05s-.92 2.05-2.05 2.05a2 2 0 0 1-.709-.13L12.9 20.602v3.088h9.6c.825 0 1.5-.675 1.5-1.5v-9c0-.825-.477-1.977-1.061-2.561z" />
  </Mark>
)

export const HomeKitIcon = ({ className }: IconProps) => (
  <Mark className={className} viewBox="0 0 512 512">
    <path d="m506.8 213.8l-47.6-37.6V90.8c0-5.8-2.3-7.4-6.4-7.4h-43.5c-4.7 0-7.6.9-7.6 7.4v39.9C338.8 81 270.6 27.2 268 25.2c-5.1-4.1-8.3-5.1-12-5.1c-3.6 0-6.8 1.1-12 5.1S12 208.4 5.2 213.8c-8.4 6.6-6 16.2 3.3 16.2h44.3v240.3c0 15.5 6.2 21.8 21 21.8h364.5c14.8 0 21-6.2 21-21.8V229.8h44.3c9.3 0 11.6-9.4 3.2-16M422 436.4c0 10.7-5.5 18.2-16.8 18.2H106.7c-11.2 0-16.8-7.4-16.8-18.2V211.9c0-13 5.7-21.4 12.2-26.5L245.7 72.1c3.8-3 7-4.3 10.2-4.3s6.4 1.3 10.2 4.3l143.5 113.3c6.5 5.1 12.2 13.4 12.2 26.5z" fillOpacity={1} />
    <path d="M409.8 185.4L266.2 72c-3.8-3-7.2-4.3-10.2-4.3c-3.1 0-6.4 1.3-10.2 4.3L102.2 185.4c-6.5 5.1-12.2 13.4-12.2 26.5v224.6c0 10.7 5.5 18.2 16.8 18.2h298.5c11.2 0 16.8-7.4 16.8-18.2V211.9c-.1-13.1-5.8-21.4-12.3-26.5m-25 217.3c0 10-5.7 14.7-14 14.7H141.3c-8.3 0-14-4.7-14-14.7V227.3c0-9.7 2.3-15.3 9.2-20.7c3.9-3.1 108.3-85.6 111.1-87.7c2.8-2.2 5.7-3.3 8.4-3.3s5.7 1.1 8.4 3.3c2.8 2.2 107.2 84.7 111.1 87.7c6.9 5.5 9.2 11.1 9.2 20.7z" fillOpacity={0.78} />
    <path d="M375.5 206.6c-3.9-3-108.3-85.6-111.1-87.7c-2.8-2.2-5.7-3.3-8.4-3.3s-5.7 1.1-8.4 3.3c-2.8 2.2-107.2 84.7-111.1 87.7c-6.9 5.5-9.2 11.1-9.2 20.7v175.4c0 10 5.7 14.7 14 14.7h229.6c8.3 0 14-4.7 14-14.7V227.3c-.2-9.6-2.5-15.2-9.4-20.7m-28 162.4c0 8-4.5 11.2-10.5 11.2H175c-6.1 0-10.5-3.1-10.5-11.2V242.9c0-5.6 0-10.1 6.1-15c4.1-3.2 76.5-60.4 78.7-62.1s4.3-2.6 6.7-2.6c2.4.1 4.8 1 6.7 2.6c2.2 1.7 74.6 58.9 78.7 62.1c6.1 4.9 6.1 9.4 6.1 15z" fillOpacity={0.6} />
    <path d="M341.4 227.9c-4.1-3.2-76.5-60.4-78.7-62.1c-1.9-1.6-4.3-2.5-6.7-2.6c-2.4 0-4.5.9-6.7 2.6s-74.7 58.9-78.7 62.1c-6.1 4.9-6.1 9.4-6.1 15V369c0 8 4.5 11.2 10.5 11.2h161.8c6.1 0 10.5-3.1 10.5-11.2V242.9c.2-5.7.2-10.1-5.9-15m-31.1 107.4c0 6.2-3.1 7.6-7.4 7.6h-93.6c-4.3 0-7.4-1.4-7.4-7.6v-77c0-4.3 2-8.5 5.3-11.2c1.9-1.6 42.6-33.4 44-34.5c2.8-2.4 7-2.4 9.9 0c1.5 1.1 42.1 33 44 34.5c3.4 2.8 5.3 6.9 5.3 11.2z" fillOpacity={0.45} />
    <path d="M256 342.8h46.8c4.3 0 7.4-1.4 7.4-7.6v-76.9c0-4.3-2-8.5-5.3-11.2c-1.9-1.6-42.6-33.4-44-34.5c-2.8-2.4-7-2.4-9.9 0c-1.4 1.1-42.1 33-44 34.5c-3.4 2.8-5.3 6.9-5.3 11.2v76.9c0 6.2 3.1 7.6 7.4 7.6z" fillOpacity={0.32} />
  </Mark>
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
