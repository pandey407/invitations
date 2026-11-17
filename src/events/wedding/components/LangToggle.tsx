import { useLang, type Lang } from '../../../lib/lang'

// Nepali / English switch for the wedding invite: maroon on a sheet of the rose paper, at the foot of the screen
// (the bells hang from the top).
export function LangToggle() {
  const { lang, setLang } = useLang()
  const option = (l: Lang, label: string) => (
    <button
      onClick={() => setLang(l)}
      aria-pressed={lang === l}
      className={`rounded-full px-3 py-1 transition-colors ${lang === l ? 'bg-kagaz-ink text-[#fbf1ec]' : 'text-kagaz-ink hover:bg-kagaz-ink/10'}`}
    >
      {label}
    </button>
  )
  return (
    <div className="fixed bottom-4 left-1/2 z-40 flex -translate-x-1/2 gap-1 rounded-full border border-kagaz-gold/50 bg-[#fbf1ec]/90 p-1 text-sm shadow-md shadow-kagaz-ink/15 backdrop-blur">
      {option('np', 'नेपाली')}
      {option('en', 'English')}
    </div>
  )
}
