import { createContext, useContext } from 'react'
import { readLink } from '../envelope/guest'

// Guests read the invite in one language at a time. Nepali by default; `?lang=en` opens it in English,
// and the toggle (components/Lang.tsx) remembers the choice on this device.
export type Lang = 'np' | 'en'
export type Pair = { np: string; en: string }

export const LANG_KEY = 'invite-lang'
export const LangContext = createContext<{ lang: Lang; setLang: (l: Lang) => void }>({ lang: 'np', setLang: () => {} })

export function initialLang(): Lang {
  const fromUrl = new URLSearchParams(location.search).get('lang')
  if (fromUrl === 'en' || fromUrl === 'np') return fromUrl
  if (readLink(location.search + location.hash).lang === 'en') return 'en' // a personal link made to open in English
  try {
    const saved = localStorage.getItem(LANG_KEY)
    if (saved === 'en' || saved === 'np') return saved
  } catch {
    // storage blocked (private mode): fall back to Nepali
  }
  return 'np'
}

export function useLang() {
  const { lang, setLang } = useContext(LangContext)
  return { lang, setLang, t: (p: Pair) => p[lang] }
}
