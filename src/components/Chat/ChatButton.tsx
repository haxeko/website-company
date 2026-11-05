import { useEffect, useId, useRef, useState, type CSSProperties } from 'react'
import { facebookHref, whatsappHref, zaloHref } from '../../config/contact'
import { useI18n } from '../../i18n/context'
import './ChatButton.css'

/* The apps' marks (Simple Icons, CC0; trademarks of Meta and of Zalo / VNG). */
const MARKS = {
  facebook:
    'M9.101 23.691v-7.98H6.627v-3.667h2.474v-1.58c0-4.085 1.848-5.978 5.858-5.978.401 0 .955.042 1.468.103a8.68 8.68 0 0 1 1.141.195v3.325a8.623 8.623 0 0 0-.653-.036 26.805 26.805 0 0 0-.733-.009c-.707 0-1.259.096-1.675.309a1.686 1.686 0 0 0-.679.622c-.258.42-.374.995-.374 1.752v1.297h3.919l-.386 2.103-.287 1.564h-3.246v8.245C19.396 23.238 24 18.179 24 12.044c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.628 3.874 10.35 9.101 11.647Z',
  whatsapp:
    'M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z',
  zalo: 'M12.49 10.2722v-.4496h1.3467v6.3218h-.7704a.576.576 0 01-.5763-.5729l-.0006.0005a3.273 3.273 0 01-1.9372.6321c-1.8138 0-3.2844-1.4697-3.2844-3.2823 0-1.8125 1.4706-3.2822 3.2844-3.2822a3.273 3.273 0 011.9372.6321l.0006.0005zM6.9188 7.7896v.205c0 .3823-.051.6944-.2995 1.0605l-.03.0343c-.0542.0615-.1815.206-.2421.2843L2.024 14.8h4.8948v.7682a.5764.5764 0 01-.5767.5761H0v-.3622c0-.4436.1102-.6414.2495-.8476L4.8582 9.23H.1922V7.7896h6.7266zm8.5513 8.3548a.4805.4805 0 01-.4803-.4798v-7.875h1.4416v8.3548H15.47zM20.6934 9.6C22.52 9.6 24 11.0807 24 12.9044c0 1.8252-1.4801 3.306-3.3066 3.306-1.8264 0-3.3066-1.4808-3.3066-3.306 0-1.8237 1.4802-3.3044 3.3066-3.3044zm-10.1412 5.253c1.0675 0 1.9324-.8645 1.9324-1.9312 0-1.065-.865-1.9295-1.9324-1.9295s-1.9324.8644-1.9324 1.9295c0 1.0667.865 1.9312 1.9324 1.9312zm10.1412-.0033c1.0737 0 1.945-.8707 1.945-1.9453 0-1.073-.8713-1.9436-1.945-1.9436-1.0753 0-1.945.8706-1.945 1.9436 0 1.0746.8697 1.9453 1.945 1.9453z',
}

type App = keyof typeof MARKS

/**
 * Bottom right of every page, over everything and fixed there while the page scrolls or its
 * spaces are swiped: one button to message VILLA NEST. Tapped, the ways to do it rise over it,
 * one above another — Facebook, WhatsApp, Zalo — and it turns into a ×; a tap elsewhere or Esc
 * folds them away (the addresses: src/config/contact.ts; one left empty is not offered).
 */
export function ChatButton() {
  const { t } = useI18n()
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const toggleRef = useRef<HTMLButtonElement>(null)
  const listId = useId()
  const apps = (
    [
      ['facebook', 'Facebook', facebookHref, t.facebook],
      ['whatsapp', 'WhatsApp', whatsappHref, t.whatsapp],
      ['zalo', 'Zalo', zaloHref, t.zalo],
    ] as [App, string, string, string][]
  ).filter(([, , href]) => href)

  useEffect(() => {
    if (!open) return
    const away = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      setOpen(false)
      toggleRef.current?.focus()
    }
    document.addEventListener('pointerdown', away)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', away)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <div ref={rootRef} className="chat" data-open={open || undefined}>
      <button
        ref={toggleRef}
        type="button"
        className="chat__toggle"
        aria-expanded={open}
        aria-controls={listId}
        aria-label={open ? t.close : t.chat}
        title={open ? t.close : t.chat}
        onClick={() => setOpen((on) => !on)}
      >
        <svg className="chat__bubble" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
          <path d="M12 4.4c4.3 0 7.7 3.1 7.7 7s-3.4 7-7.7 7c-1.1 0-2.2-.2-3.2-.6l-4.1 1.5 1.2-3.7c-1.1-1.2-1.6-2.6-1.6-4.2 0-3.9 3.4-7 7.7-7z" />
          <circle className="is-filled" cx="8.6" cy="11.4" r="1.05" />
          <circle className="is-filled" cx="12" cy="11.4" r="1.05" />
          <circle className="is-filled" cx="15.4" cy="11.4" r="1.05" />
        </svg>
        <svg className="chat__close" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
          <path d="M6.5 6.5l11 11M17.5 6.5l-11 11" />
        </svg>
      </button>
      <ul id={listId} className="chat__list" aria-label={t.chat}>
        {apps.map(([app, name, href, label], i) => (
          // (they rise from the button up: the nearest first)
          <li key={app} style={{ '--i': apps.length - 1 - i } as CSSProperties}>
            <a
              className="chat__app"
              data-app={app}
              href={href}
              target="_blank"
              rel="noopener"
              aria-label={label}
              onClick={() => setOpen(false)}
            >
              <span className="chat__name" aria-hidden="true">
                {name}
              </span>
              <span className="chat__mark">
                <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                  <path d={MARKS[app]} />
                </svg>
              </span>
            </a>
          </li>
        ))}
      </ul>
    </div>
  )
}
