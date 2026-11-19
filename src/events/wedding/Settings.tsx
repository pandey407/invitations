import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { linkParam } from '../../envelope/guest'
import { reception } from '../reception/content'
import loktaUrl from './assets/lokta.webp'
import { wedding } from './content'
import { sayTime, timesForLink, type PartKey } from './times'

// The link maker (/wedding/settings, for us, not linked from the cards and kept out of search): pick whose side the
// card is from, change any of the day's times, optionally address it to someone (with a चु: for a चुलेनिम्तो), and
// copy the link. The name, times and language travel in the link itself, in one code (#g=…, like the guest-list
// sheet's names: src/envelope/guest.ts), so nothing is stored anywhere and nothing is readable in the link.

type Side = 'groom' | 'bride' | 'reception'

const SIDES: { key: Side; label: string; sub: string; path: string; parts: readonly PartKey[] }[] = [
  { key: 'groom', label: 'Groom’s side', sub: 'अस्लेष · janti, wedding, reception', path: 'wedding/', parts: wedding.sides.both.parts },
  { key: 'bride', label: 'Bride’s side', sub: 'आरुषा · wedding', path: `wedding/${wedding.sides.bride.path}/`, parts: wedding.sides.bride.parts },
  { key: 'reception', label: 'Reception only', sub: 'प्रीतिभोज', path: `${reception.slug}/`, parts: reception.sides.both.parts },
]

const DEFAULTS = Object.fromEntries(
  (Object.keys(wedding.programme) as PartKey[]).map((k) => [k, wedding.programme[k].at]),
) as Record<PartKey, string>

// Copy text on any phone or laptop: the Clipboard API where the browser allows it, else the old select-and-copy
// (what older iPhones and in-app browsers need: a real, selected text field).
async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    const field = document.createElement('textarea')
    field.value = text
    field.setAttribute('readonly', '')
    field.style.cssText = 'position:fixed;top:0;left:0;opacity:0;font-size:16px' // 16px: iOS won't zoom in
    document.body.appendChild(field)
    field.contentEditable = 'true'
    field.readOnly = false
    const range = document.createRange()
    range.selectNodeContents(field)
    const selection = window.getSelection()
    selection?.removeAllRanges()
    selection?.addRange(range)
    field.setSelectionRange(0, text.length)
    let ok = false
    try {
      ok = document.execCommand('copy')
    } catch {
      ok = false
    }
    field.remove()
    return ok
  }
}

// A time chosen in three big taps (easier on a phone than the browser's time box): hour, minutes, AM / PM.
const HOURS = Array.from({ length: 12 }, (_, i) => i + 1)
const MINUTES = ['00', '15', '30', '45']
// The browser's own dropdown arrow is cramped and differs everywhere: it's hidden and a chevron drawn in its place.
const pick =
  'w-full appearance-none rounded-xl border border-kagaz-gold/40 bg-white py-2.5 pr-9 pl-4 text-base font-semibold [font-variant-numeric:lining-nums_tabular-nums]'

function Dropdown({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (v: string) => void }) {
  return (
    <span className="relative">
      <select aria-label={label} value={value} onChange={(e) => onChange(e.target.value)} className={pick}>
        {options.map((x) => (
          <option key={x} value={x}>
            {x}
          </option>
        ))}
      </select>
      <svg aria-hidden viewBox="0 0 20 20" className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 fill-none stroke-kagaz-gold stroke-2">
        <path d="m5 8 5 5 5-5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  )
}

function TimePicker({ value, onChange, label }: { value: string; onChange: (at: string) => void; label: string }) {
  const [h, m] = value.split(':').map(Number)
  const pm = h >= 12
  const h12 = h % 12 || 12
  const mm = String(m).padStart(2, '0')
  const set = (hour12: number, minute: number, isPm: boolean) =>
    onChange(`${String((hour12 % 12) + (isPm ? 12 : 0)).padStart(2, '0')}:${String(minute).padStart(2, '0')}`)
  // A time already set to other minutes still shows in the list.
  const minutes = MINUTES.includes(mm) ? MINUTES : [...MINUTES, mm].sort()
  return (
    <div className="grid grid-cols-[1fr_1fr_auto] items-center gap-2">
      <Dropdown label={`${label}: hour`} value={String(h12)} options={HOURS.map(String)} onChange={(v) => set(Number(v), m, pm)} />
      <Dropdown label={`${label}: minutes`} value={mm} options={minutes} onChange={(v) => set(h12, Number(v), pm)} />
      <div role="group" aria-label={`${label}: AM or PM`} className="flex overflow-hidden rounded-xl border border-kagaz-gold/40">
        {(['AM', 'PM'] as const).map((x) => (
          <button
            key={x}
            type="button"
            aria-pressed={(x === 'PM') === pm}
            onClick={() => set(h12, m, x === 'PM')}
            className={`px-3.5 py-2.5 text-base font-semibold ${(x === 'PM') === pm ? 'bg-kagaz-ink text-[#fbf1ec]' : 'bg-white'}`}
          >
            {x}
          </button>
        ))}
      </div>
    </div>
  )
}

const Label = ({ children }: { children: ReactNode }) => <p className="mb-2 text-xs font-semibold tracking-[0.18em] text-kagaz-gold uppercase">{children}</p>

export default function Settings() {
  const [side, setSide] = useState<Side>('groom')
  const [times, setTimes] = useState<Record<PartKey, string>>(DEFAULTS)
  const [name, setName] = useState('')
  const [chu, setChu] = useState(false)
  const [english, setEnglish] = useState(false)
  const [result, setResult] = useState<{ link: string; ok: boolean } | null>(null) // the last copy, and of which link

  // The page's look: the wedding's fonts and its rose lokta paper.
  useEffect(() => {
    document.title = 'Invite link maker'
    const fonts = Object.assign(document.createElement('link'), { rel: 'stylesheet', href: wedding.fonts })
    document.head.appendChild(fonts)
    const { style } = document.body
    style.background = `url(${loktaUrl}) 0 0 / 640px, #ffded3`
    style.backgroundBlendMode = 'multiply'
    return () => fonts.remove()
  }, [])

  const chosen = SIDES.find((s) => s.key === side)!
  const link = useMemo(() => {
    // Everything rides in one code after a #, like the sheet's names: #g=…
    const shownTimes = Object.fromEntries(chosen.parts.map((k) => [k, times[k]]))
    const g = linkParam({ name, chu, times: timesForLink(shownTimes, DEFAULTS), english })
    return wedding.siteUrl + chosen.path + (g ? `#g=${g}` : '')
  }, [chosen, times, name, chu, english])

  const copied = result?.link === link ? (result.ok ? 'yes' : 'no') : null // changing anything clears it
  const copy = async () => setResult({ link, ok: await copyText(link) })
  const canShare = typeof navigator.share === 'function'
  const share = () => navigator.share({ url: link }).catch(() => {})

  return (
    <main className="mx-auto flex min-h-svh w-full max-w-md flex-col gap-6 px-4 py-8 text-kagaz-ink">
      <header className="text-center">
        <h1 className="font-names text-4xl">Invite link maker</h1>
        <p className="mt-1 text-sm opacity-70">अस्लेष र आरुषा · शुभ विवाह</p>
      </header>

      <section className="rounded-3xl border border-kagaz-gold/30 bg-[#fbf1ec]/80 p-5 shadow-sm shadow-kagaz-ink/10">
        <Label>Sender side</Label>
        <div className="grid gap-2">
          {SIDES.map((s) => (
            <button
              key={s.key}
              type="button"
              onClick={() => setSide(s.key)}
              aria-pressed={side === s.key}
              className={`rounded-2xl border px-4 py-3 text-left transition-colors ${side === s.key ? 'border-kagaz-ink bg-kagaz-ink text-[#fbf1ec]' : 'border-kagaz-gold/40 bg-white/60 hover:bg-white'}`}
            >
              <span className="block text-base font-semibold">{s.label}</span>
              <span className="block text-sm opacity-75">{s.sub}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="rounded-3xl border border-kagaz-gold/30 bg-[#fbf1ec]/80 p-5 shadow-sm shadow-kagaz-ink/10">
        <div className="flex items-baseline justify-between">
          <Label>Times</Label>
          <button type="button" onClick={() => setTimes(DEFAULTS)} className="text-xs underline decoration-kagaz-gold/60 underline-offset-4">
            Reset
          </button>
        </div>
        <div className="grid gap-3">
          {chosen.parts.map((k) => (
            <div key={k} className="flex flex-col gap-2">
              <div className="flex items-baseline justify-between gap-3">
                <span className="font-semibold">{wedding.programme[k].title.en}</span>
                <span className="text-sm opacity-75">{sayTime(times[k], wedding.programme[k].onwards).np}</span>
              </div>
              <TimePicker value={times[k]} onChange={(at) => setTimes({ ...times, [k]: at })} label={wedding.programme[k].title.en} />
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-3xl border border-kagaz-gold/30 bg-[#fbf1ec]/80 p-5 shadow-sm shadow-kagaz-ink/10">
        <Label>Receiver (optional)</Label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="श्री राम प्रसाद पाण्डे ज्यू"
          maxLength={80}
          className="w-full rounded-xl border border-kagaz-gold/40 bg-white px-3 py-2.5 text-base"
        />
        <p className="mt-1.5 text-xs opacity-70">Shown on the envelope, written as it should appear.</p>
        <label className={`mt-3 flex items-center gap-2 ${name.trim() ? '' : 'opacity-50'}`}>
          <input type="checkbox" checked={chu} disabled={!name.trim()} onChange={(e) => setChu(e.target.checked)} className="size-5 accent-kagaz-ink" />
          <span>चु: stamp (चुलेनिम्तो, the whole household)</span>
        </label>
        <label className="mt-2 flex items-center gap-2">
          <input type="checkbox" checked={english} onChange={(e) => setEnglish(e.target.checked)} className="size-5 accent-kagaz-ink" />
          <span>Open in English</span>
        </label>
      </section>

      <section className="rounded-3xl border border-kagaz-gold/30 bg-[#fbf1ec]/80 p-5 shadow-sm shadow-kagaz-ink/10">
        <Label>Link</Label>
        <input
          readOnly
          value={link}
          onFocus={(e) => e.target.select()}
          className="w-full rounded-xl border border-kagaz-gold/40 bg-white px-3 py-2.5 font-mono text-sm"
        />
        <div className="mt-3 grid grid-cols-[1fr_auto_auto] gap-2">
          <button type="button" onClick={copy} className="rounded-xl bg-kagaz-ink px-4 py-3 font-semibold text-[#fbf1ec] active:scale-[0.98]">
            {copied === 'yes' ? 'Copied ✓' : 'Copy link'}
          </button>
          {canShare && (
            <button type="button" onClick={share} className="rounded-xl border border-kagaz-ink px-4 py-3 font-semibold">
              Share
            </button>
          )}
          <a href={link} target="_blank" rel="noreferrer" className="rounded-xl border border-kagaz-gold/50 px-4 py-3 text-center font-semibold">
            Open
          </a>
        </div>
        {copied === 'no' && <p className="mt-2 text-sm text-[#9a1b1b]">Couldn’t copy here: tap the link above, select all, and copy.</p>}
      </section>
    </main>
  )
}
