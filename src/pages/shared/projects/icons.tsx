import type { ReactNode } from 'react'
import type { ProjectCategory } from './data'

/** Line icons on a 24 × 24 grid, drawn in the text colour (as the pages' strips under the header). */
function Svg({ children }: { children: ReactNode }) {
  return (
    <svg className="pv-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      {children}
    </svg>
  )
}

/** A map pin. */
export const PlaceIcon = () => (
  <Svg>
    <path d="M12 21.2s-6.6-6-6.6-11.3a6.6 6.6 0 0 1 13.2 0c0 5.3-6.6 11.3-6.6 11.3z" />
    <circle cx="12" cy="9.9" r="2.5" />
  </Svg>
)

/** A calendar page, one day marked. */
export const YearIcon = () => (
  <Svg>
    <rect x="3.6" y="5.2" width="16.8" height="15.4" rx="2.2" />
    <path d="M3.6 9.8h16.8M8.2 3.2v4M15.8 3.2v4" />
    <rect className="is-filled" x="13.4" y="13.6" width="3.4" height="3.4" rx="0.8" />
  </Svg>
)

/** A plan with its two dimension lines. */
export const AreaIcon = () => (
  <Svg>
    <rect x="7.2" y="7.2" width="13.2" height="13.2" rx="1.2" />
    <path d="M7.2 3.6h13.2M3.6 7.2v13.2" />
    <path d="M7.2 2.6v2M20.4 2.6v2M2.6 7.2h2M2.6 20.4h2" />
  </Svg>
)

/** A tower crane: building (the Construction page, a construction project's scope). */
export const CraneIcon = () => (
  <Svg>
    <path d="M8.4 21V6.6M5.2 21h6.4M3.2 6.6h17.6" />
    <path d="M6.9 6.6 8.4 2.9l1.5 3.7M8.4 2.9l12.4 3.7M8.4 2.9 3.2 6.6" />
    <path d="M17.4 6.6v5" />
    <path d="M17.4 11.6a1.5 1.5 0 1 1-1.5 1.5" />
    <rect className="is-filled" x="3.2" y="6.6" width="2.6" height="2.2" rx="0.3" />
  </Svg>
)

/** A sofa: furnishing (the Interior page, an interior project's scope). */
export const SofaIcon = () => (
  <Svg>
    <path d="M5.4 11.2V8.6A2.4 2.4 0 0 1 7.8 6.2h8.4a2.4 2.4 0 0 1 2.4 2.4v2.6" />
    <path d="M3.4 18V12.8a1.6 1.6 0 0 1 3.2 0v1.8h10.8v-1.8a1.6 1.6 0 0 1 3.2 0V18z" />
    <path d="M5.4 18v2M18.6 18v2" />
  </Svg>
)

/** What was done: a tower crane (construction), a sofa (interior). */
export const ScopeIcon = ({ category }: { category: ProjectCategory }) => (category === 'construction' ? <CraneIcon /> : <SofaIcon />)

/** VILLA NEST's mark (the roof of its icon): the home page. */
export const HomeMarkIcon = () => (
  <Svg>
    <path d="M4.6 14.6 12 6.8l7.4 7.8" />
    <path d="M7.8 18.6h8.4" />
  </Svg>
)

/** A house on Wi-Fi: the Smart Home page. */
export const SmartHomeIcon = () => (
  <Svg>
    <path d="M4 11.2 12 4.6l8 6.6v8.8H4z" />
    <path d="M8.9 14.6a4.4 4.4 0 0 1 6.2 0" />
    <path d="M10.7 16.6a1.9 1.9 0 0 1 2.6 0" />
    <circle className="is-filled" cx="12" cy="18.4" r="0.9" />
  </Svg>
)
