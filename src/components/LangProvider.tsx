import { useEffect, useState, type ReactNode } from 'react'
import { LangContext, initialLang, type Lang } from '../lib/lang'

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(initialLang)
  const setLang = setLangState
  useEffect(() => {
    document.documentElement.lang = lang === 'en' ? 'en' : 'ne'
  }, [lang])
  return <LangContext.Provider value={{ lang, setLang }}>{children}</LangContext.Provider>
}
