import { useEffect, useRef, type ReactNode } from 'react'
import { useI18n } from '../../i18n/context'

interface HomeSheetProps {
  open: boolean
  onClose: () => void
  children: ReactNode
}

/**
 * Phones: the wall panel is too small to tap precisely, so a tap opens this enlarged copy
 * at the bottom of the screen. The room stays visible above it, so the lights, snow and
 * leaves can still be seen reacting.
 */
export function HomeSheet({ open, onClose, children }: HomeSheetProps) {
  const { t } = useI18n()
  const closeRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!open) return
    closeRef.current?.focus({ preventScroll: true })
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  return (
    <div className="sh-sheet" data-open={open || undefined} inert={!open}>
      <div className="sh-sheet__backdrop" onClick={onClose} />
      <div className="sh-sheet__panel" role="dialog" aria-modal="true" aria-label={t.homePanel}>
        <button ref={closeRef} type="button" className="sh-sheet__close" onClick={onClose}>
          {t.close}
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M6 6l12 12M18 6 6 18" />
          </svg>
        </button>
        <div className="sh-sheet__screen">{children}</div>
      </div>
    </div>
  )
}
