import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { I18nContext } from './context'
import { DEFAULT_LANG, LANGS, strings, type Lang } from './strings'

const STORAGE_KEY = 'villa-nest-lang'

function initialLang(): Lang {
  const param = new URLSearchParams(window.location.search).get('lang')
  if (LANGS.includes(param as Lang)) return param as Lang
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY)
    if (LANGS.includes(saved as Lang)) return saved as Lang
  } catch {
    /* storage unavailable (private mode) */
  }
  return DEFAULT_LANG
}

/** Vietnamese by default; the visitor's choice is remembered in this browser. */
export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(initialLang)

  const setLang = useCallback((next: Lang) => {
    setLangState(next)
    try {
      window.localStorage.setItem(STORAGE_KEY, next)
    } catch {
      /* storage unavailable */
    }
  }, [])

  useEffect(() => {
    document.documentElement.lang = lang
    document.title = strings[lang].documentTitle
  }, [lang])

  const value = useMemo(() => ({ lang, t: strings[lang], setLang }), [lang, setLang])
  return <I18nContext value={value}>{children}</I18nContext>
}
