/** The few line icons every page shares (24 × 24, in the text colour). */

/** The home page's call to action: an arrow to the top right. */
export const CtaArrow = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
    <path d="M7 17 17 7M9 7h8v8" />
  </svg>
)

export const PlayGlyph = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
    <path className="is-filled" d="M9.2 7.4v9.2l7-4.6z" />
  </svg>
)

export const StopGlyph = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
    <rect className="is-filled" x="8.2" y="8.2" width="7.6" height="7.6" rx="1" />
  </svg>
)

/** The previous / next arrows beside the counter. */
export const SideArrow = ({ direction }: { direction: 'left' | 'right' }) => (
  <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
    <path d={direction === 'left' ? 'M19 12H5M11 6l-6 6 6 6' : 'M5 12h14M13 6l6 6-6 6'} />
  </svg>
)
