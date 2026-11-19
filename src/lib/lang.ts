import { createContext, useContext } from 'react'
import { readLink } from '../envelope/guest'

// Guests read the invite in one language at a time. Every invite opens in Nepali unless its link asks for English
// (`?lang=en`, or a personal link made to open in English); the toggle (components/Lang.tsx) switches for this visit only.
export type Lang = 'np' | 'en'
export type Pair = { np: string; en: string }

export const LangContext = createContext<{ lang: Lang; setLang: (l: Lang) => void }>({ lang: 'np', setLang: () => {} })

export function initialLang(): Lang {
  const fromUrl = new URLSearchParams(location.search).get('lang')
  if (fromUrl === 'en' || fromUrl === 'np') return fromUrl
  if (readLink(location.search + location.hash).lang === 'en') return 'en' // a personal link made to open in English
  return 'np'
}

export function useLang() {
  const { lang, setLang } = useContext(LangContext)
  return { lang, setLang, t: (p: Pair) => p[lang] }
}
