import { useId, type MouseEvent } from 'react'
import { useI18n } from '../../i18n/context'
import type { Lang } from '../../i18n/strings'
import { ZaloButton } from '../Zalo/ZaloButton'
import './Header.css'

/**
 * Company logo: drop `logo.svg`, `logo.png` or `logo.webp` (transparent background) into
 * src/assets/brand/ and it is picked up at build time. Until then a wordmark is shown.
 */
const logoFiles = import.meta.glob<string>('../../assets/brand/logo.{svg,png,webp}', {
  eager: true,
  query: '?url',
  import: 'default',
})
const logoUrl = Object.values(logoFiles)[0]

interface HeaderProps {
  soundOn: boolean
  onToggleSound: () => void
  /** On the home page the logo brings the carousel back to its first view instead of reloading… */
  onLogoClick?: () => void
  /** …on other pages it is a plain link home. */
  homeHref?: string
}

function FlagVN() {
  return (
    <svg viewBox="0 0 30 20" aria-hidden="true">
      <rect width="30" height="20" fill="#da251d" />
      <path
        fill="#ffff00"
        d="M15 4.2l1.35 4.16h4.37l-3.54 2.57 1.35 4.16L15 12.52l-3.53 2.57 1.35-4.16-3.54-2.57h4.37z"
      />
    </svg>
  )
}

function FlagUK() {
  const id = useId()
  return (
    <svg viewBox="0 0 60 30" aria-hidden="true">
      <clipPath id={`${id}s`}>
        <path d="M0 0v30h60V0z" />
      </clipPath>
      <clipPath id={`${id}t`}>
        <path d="M30 15h30v15zv15H0zH0V0zV0h30z" />
      </clipPath>
      <g clipPath={`url(#${id}s)`}>
        <path d="M0 0v30h60V0z" fill="#012169" />
        <path d="M0 0l60 30m0-30L0 30" stroke="#fff" strokeWidth="6" />
        <path d="M0 0l60 30m0-30L0 30" clipPath={`url(#${id}t)`} stroke="#c8102e" strokeWidth="4" />
        <path d="M30 0v30M0 15h60" stroke="#fff" strokeWidth="10" />
        <path d="M30 0v30M0 15h60" stroke="#c8102e" strokeWidth="6" />
      </g>
    </svg>
  )
}

const FLAGS: Record<Lang, () => React.JSX.Element> = { vi: FlagVN, en: FlagUK }

export function Header({ soundOn, onToggleSound, onLogoClick, homeHref = './' }: HeaderProps) {
  const { lang, t, setLang } = useI18n()

  const handleLogo = (event: MouseEvent<HTMLAnchorElement>) => {
    if (!onLogoClick) return
    event.preventDefault()
    onLogoClick()
  }

  // (every page has the header, so the Zalo button in the corner comes with it)
  return (
    <>
      <header className="site-header">
        <a className="site-header__logo" href={homeHref} onClick={handleLogo} aria-label={t.home}>
          {logoUrl ? (
            <img src={logoUrl} alt="VILLA NEST — Architecture & Construction" />
          ) : (
            <span className="site-header__wordmark">
              VILLA NEST
              <small>Architecture &amp; Construction</small>
            </span>
          )}
        </a>

        <p className="site-header__slogan">{t.slogan}</p>

        <div className="site-header__tools">
          <button
            type="button"
            className="site-header__sound"
            aria-pressed={soundOn}
            aria-label={t.soundToggle}
            data-on={soundOn || undefined}
            onClick={onToggleSound}
          >
            <span className="site-header__bars" aria-hidden="true">
              <i />
              <i />
              <i />
              <i />
            </span>
            <span className="site-header__sound-label">{soundOn ? t.soundOn : t.soundOff}</span>
          </button>

          <div className="site-header__lang" role="group" aria-label={t.language}>
            {(Object.keys(FLAGS) as Lang[]).map((code) => {
              const Flag = FLAGS[code]
              return (
                <button
                  key={code}
                  type="button"
                  lang={code}
                  aria-pressed={lang === code}
                  aria-label={code === 'vi' ? 'Tiếng Việt' : 'English'}
                  onClick={() => setLang(code)}
                >
                  <Flag />
                  <span>{code.toUpperCase()}</span>
                </button>
              )
            })}
          </div>
        </div>
      </header>
      <ZaloButton />
    </>
  )
}
