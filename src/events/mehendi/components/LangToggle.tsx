import { useLang, type Lang } from '../../../lib/lang'

// Nepali / English switch for the mehendi invite.
export function LangToggle() {
  const { lang, setLang } = useLang()
  const option = (l: Lang, label: string) => (
    <button
      onClick={() => setLang(l)}
      aria-pressed={lang === l}
      className={`rounded-full px-3 py-1 transition-colors ${lang === l ? 'bg-leaf text-cream shadow-sm' : 'text-leaf hover:bg-leaf/10'}`}
    >
      {label}
    </button>
  )
  return (
    <div className="fixed top-3 left-1/2 z-40 flex -translate-x-1/2 gap-1 rounded-full border border-gold/50 bg-cream/90 p-1 text-sm shadow-md shadow-leaf/15 backdrop-blur">
      {option('np', 'नेपाली')}
      {option('en', 'English')}
    </div>
  )
}
