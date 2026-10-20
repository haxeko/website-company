import { createContext, useContext } from 'react'
import { DEFAULT_LANG, strings, type Lang, type UiStrings } from './strings'

export interface I18n {
  lang: Lang
  t: UiStrings
  setLang: (lang: Lang) => void
}

export const I18nContext = createContext<I18n>({
  lang: DEFAULT_LANG,
  t: strings[DEFAULT_LANG],
  setLang: () => {},
})

export const useI18n = () => useContext(I18nContext)
