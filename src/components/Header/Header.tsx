import type { MouseEvent, Ref } from 'react'
import './Header.css'

interface HeaderProps {
  menuOpen: boolean
  onToggleMenu: () => void
  /** The logo brings the carousel back to its first view instead of reloading the page. */
  onLogoClick: () => void
  toggleRef?: Ref<HTMLButtonElement>
}

export function Header({ menuOpen, onToggleMenu, onLogoClick, toggleRef }: HeaderProps) {
  const handleLogo = (event: MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault()
    onLogoClick()
  }

  return (
    <header className="site-header" data-menu-open={menuOpen || undefined}>
      <a className="site-header__logo" href="./" onClick={handleLogo}>
        VILLA NEST
      </a>
      <button
        ref={toggleRef}
        type="button"
        className="site-header__toggle"
        aria-expanded={menuOpen}
        aria-controls="site-menu"
        aria-label={menuOpen ? 'Close menu' : 'Open menu'}
        onClick={onToggleMenu}
      >
        <span className="site-header__bar" />
        <span className="site-header__bar" />
        <span className="site-header__bar" />
      </button>
    </header>
  )
}
