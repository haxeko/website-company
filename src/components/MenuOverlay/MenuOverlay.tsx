import { useEffect, useRef, type CSSProperties } from 'react'
import type { Slide } from '../../data/slides'
import './MenuOverlay.css'

interface MenuOverlayProps {
  open: boolean
  slides: Slide[]
  activeIndex: number
  onSelect: (index: number) => void
  onClose: () => void
}

const year = new Date().getFullYear()

/** Full-screen navigation opened by the header toggle (disclosure pattern). */
export function MenuOverlay({ open, slides, activeIndex, onSelect, onClose }: MenuOverlayProps) {
  const firstLinkRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!open) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    const focusTimer = window.setTimeout(() => firstLinkRef.current?.focus({ preventScroll: true }), 120)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.clearTimeout(focusTimer)
    }
  }, [open, onClose])

  return (
    <div id="site-menu" className="menu" data-open={open || undefined} inert={!open}>
      <nav className="menu__nav" aria-label="Main">
        <ol className="menu__list">
          {slides.map((slide, i) => (
            <li key={slide.id} className="menu__item" style={{ '--i': i } as CSSProperties}>
              <button
                ref={i === 0 ? firstLinkRef : undefined}
                type="button"
                className="menu__link"
                aria-current={i === activeIndex ? 'true' : undefined}
                onClick={() => onSelect(i)}
              >
                <span className="menu__index">{String(i + 1).padStart(2, '0')}</span>
                <span className="menu__title">{slide.title}</span>
                <span className="menu__caption">{slide.caption}</span>
              </button>
            </li>
          ))}
        </ol>
      </nav>
      <div className="menu__footer">
        <span>Architecture · Interior · Smart Home</span>
        <span>© {year} Villa Nest</span>
      </div>
    </div>
  )
}
