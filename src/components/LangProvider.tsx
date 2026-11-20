import { useEffect, useRef, useState, type ReactNode } from 'react'
import { savedRow } from '../envelope/saved'
import { LangContext, initialLang, type Lang } from '../lib/lang'

export function LangProvider({ children, savedLinks }: { children: ReactNode; savedLinks?: string }) {
  const [lang, setLangState] = useState<Lang>(initialLang)
  const toggled = useRef(false)
  const setLang = (l: Lang) => {
    toggled.current = true
    setLangState(l)
  }
  // A link changed after it was sent (src/envelope/saved.ts) opens in its changed language, unless ?lang= says
  // otherwise or the guest has already switched.
  useEffect(() => {
    if (new URLSearchParams(location.search).get('lang')) return
    let live = true
    savedRow(savedLinks).then((row) => live && row?.lang && !toggled.current && setLangState(row.lang))
    return () => {
      live = false
    }
  }, [savedLinks])
  useEffect(() => {
    document.documentElement.lang = lang === 'en' ? 'en' : 'ne'
  }, [lang])
  return <LangContext.Provider value={{ lang, setLang }}>{children}</LangContext.Provider>
}
