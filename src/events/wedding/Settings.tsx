import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { linkParam } from '../../envelope/guest'
import { reception } from '../reception/content'
import loktaUrl from './assets/lokta.webp'
import { wedding } from './content'
import { sayTime, timesForLink, type PartKey } from './times'

// The link maker (/wedding/settings, for us, not linked from the cards and kept out of search): pick whose side the
// card is from, change any of the day's times, optionally address it to someone (with a चु: for a चुलेनिम्तो), and
// copy the link. The name, times and language travel in the link itself, in one code (#g=…, like the guest-list
// sheet's names: src/envelope/guest.ts), so nothing is readable in the link. With the guest sheet's web app set up
// (savedLinks in content.ts: scripts/wedding/sent-links.gs), each link copied, shared or opened is also saved there
// with an id, and "Sent links" below lists them and changes their times: a card opened from a saved link shows
// its row's times.

type Side = 'groom' | 'bride' | 'reception'

const SIDES: { key: Side; label: string; sub: string; path: string; parts: readonly PartKey[] }[] = [
  { key: 'groom', label: 'Groom’s side', sub: 'अस्लेष · janti, wedding, reception', path: 'wedding/', parts: wedding.sides.both.parts },
  { key: 'bride', label: 'Bride’s side', sub: 'आरुषा · wedding', path: `wedding/${wedding.sides.bride.path}/`, parts: wedding.sides.bride.parts },
  { key: 'reception', label: 'Reception only', sub: 'प्रीतिभोज', path: `${reception.slug}/`, parts: reception.sides.both.parts },
]

const API = wedding.savedLinks
const KEY_STORE = 'link-maker-passcode'
const readKey = () => {
  try {
    return localStorage.getItem(KEY_STORE) ?? ''
  } catch {
    return ''
  }
}
// A short random id for a saved link: 8 letters and digits.
const newId = () => Array.from(crypto.getRandomValues(new Uint8Array(8)), (b) => 'abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789'[b % 56]).join('')
// The web app (text/plain, so no CORS preflight; Apps Script answers any origin).
async function callApi(body: Record<string, unknown>) {
  const r = await fetch(API, { method: 'POST', body: JSON.stringify(body) })
  return r.json()
}
// "1000" (as the sheet sends) ↔ "10:00" (as the pickers use).
const colon = (t: string) => `${t.slice(0, 2)}:${t.slice(2)}`
const LETTER: Record<PartKey, string> = { janti: 'j', ceremony: 'c', reception: 'r' }

type Saved = { id: string; made: string; side: string; name: string; t: Record<string, string>; link: string }

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
  const [key, setKey] = useState(readKey)
  const [id, setId] = useState(newId)
  const [savedAs, setSavedAs] = useState<{ id: string; key: string } | null>(null) // what's saved under `id`
  const [saveState, setSaveState] = useState<'saving' | 'saved' | 'failed' | 'passcode' | null>(null)

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
  const shownTimes = useMemo(() => Object.fromEntries(chosen.parts.map((k) => [k, times[k]])) as Partial<Record<PartKey, string>>, [chosen, times])
  const content = JSON.stringify([side, shownTimes, name.trim(), chu, english])
  // A link already saved keeps its id; change anything after that and it becomes a new link with a new id.
  useEffect(() => {
    if (savedAs && savedAs.id === id && savedAs.key !== content) {
      setId(newId())
      setSaveState(null)
    }
  }, [content, savedAs, id])
  const saving = Boolean(API && key)
  const link = useMemo(() => {
    // Everything rides in one code after a #, like the sheet's names: #g=…
    const g = linkParam({ name, chu, times: timesForLink(shownTimes, DEFAULTS), english, id: saving ? id : '' })
    return wedding.siteUrl + chosen.path + (g ? `#g=${g}` : '')
  }, [chosen, shownTimes, name, chu, english, id, saving])

  // Saved after the copy / share / open (those must run straight from the tap, or phones refuse them).
  const save = async () => {
    if (!saving || (savedAs?.id === id && savedAs.key === content)) return
    setSaveState('saving')
    try {
      const r = await callApi({ key, action: 'save', id, side, name: name.trim(), chu: chu && Boolean(name.trim()), english, times: shownTimes, link })
      if (r.ok) {
        setSavedAs({ id, key: content })
        setSaveState('saved')
        setListVersion((v) => v + 1)
      } else setSaveState(r.error === 'passcode' ? 'passcode' : 'failed')
    } catch {
      setSaveState('failed')
    }
  }
  const [listVersion, setListVersion] = useState(0)

  const copied = result?.link === link ? (result.ok ? 'yes' : 'no') : null // changing anything clears it
  const copy = async () => {
    const ok = await copyText(link)
    setResult({ link, ok })
    save()
  }
  const canShare = typeof navigator.share === 'function'
  const share = () => {
    navigator.share({ url: link }).catch(() => {})
    save()
  }

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
          <a href={link} target="_blank" rel="noreferrer" onClick={save} className="rounded-xl border border-kagaz-gold/50 px-4 py-3 text-center font-semibold">
            Open
          </a>
        </div>
        {copied === 'no' && <p className="mt-2 text-sm text-[#9a1b1b]">Couldn’t copy here: tap the link above, select all, and copy.</p>}
        {saving && saveState && (
          <p className={`mt-2 text-sm ${saveState === 'saved' || saveState === 'saving' ? 'opacity-70' : 'text-[#9a1b1b]'}`}>
            {saveState === 'saving' && 'Saving to Sent links…'}
            {saveState === 'saved' && 'Saved to Sent links ✓ (its times can be changed below)'}
            {saveState === 'failed' && 'Couldn’t save it to Sent links: the link still works, with the times above.'}
            {saveState === 'passcode' && 'The passcode is wrong, so it wasn’t saved: set it again below.'}
          </p>
        )}
      </section>

      {API && <SentLinks passcode={key} setPasscode={setKey} version={listVersion} />}
    </main>
  )
}

const sideOf = (key: string) => SIDES.find((s) => s.key === key)

// The links saved in the guest sheet's "Sent links" tab, newest first; change a link's times and its card follows.
function SentLinks({ passcode, setPasscode, version }: { passcode: string; setPasscode: (k: string) => void; version: number }) {
  const [typed, setTyped] = useState('')
  const [links, setLinks] = useState<Saved[] | null>(null)
  const [problem, setProblem] = useState<string | null>(null)
  const [filter, setFilter] = useState('')

  useEffect(() => {
    if (!passcode) return
    let live = true
    setProblem(null)
    callApi({ key: passcode, action: 'list' })
      .then((r) => {
        if (!live) return
        if (r.error === 'passcode') {
          setProblem('That passcode isn’t right.')
          setPasscode('')
          try {
            localStorage.removeItem(KEY_STORE)
          } catch {
            // not stored
          }
        } else if (Array.isArray(r.links)) setLinks((r.links as Saved[]).reverse())
        else setProblem('Couldn’t load the sent links.')
      })
      .catch(() => live && setProblem('Couldn’t reach the guest sheet.'))
    return () => {
      live = false
    }
  }, [passcode, version, setPasscode])

  const unlock = () => {
    const k = typed.trim()
    if (!k) return
    try {
      localStorage.setItem(KEY_STORE, k)
    } catch {
      // kept for this visit only
    }
    setPasscode(k)
  }

  const shown = (links ?? []).filter((l) => !filter.trim() || l.name.toLowerCase().includes(filter.trim().toLowerCase()))
  return (
    <section className="rounded-3xl border border-kagaz-gold/30 bg-[#fbf1ec]/80 p-5 shadow-sm shadow-kagaz-ink/10">
      <Label>Sent links</Label>
      {!passcode ? (
        <>
          <p className="mb-2 text-sm opacity-75">Enter the passcode to save links and change their times later.</p>
          <div className="grid grid-cols-[1fr_auto] gap-2">
            <input
              type="password"
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && unlock()}
              placeholder="Passcode"
              className="rounded-xl border border-kagaz-gold/40 bg-white px-3 py-2.5 text-base"
            />
            <button type="button" onClick={unlock} className="rounded-xl bg-kagaz-ink px-4 py-2.5 font-semibold text-[#fbf1ec]">
              Unlock
            </button>
          </div>
          {problem && <p className="mt-2 text-sm text-[#9a1b1b]">{problem}</p>}
        </>
      ) : problem ? (
        <p className="text-sm text-[#9a1b1b]">{problem}</p>
      ) : !links ? (
        <p className="text-sm opacity-70">Loading…</p>
      ) : !links.length ? (
        <p className="text-sm opacity-70">None yet: links you copy, share or open above are saved here.</p>
      ) : (
        <div className="grid gap-3">
          {links.length > 5 && (
            <input
              type="search"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="Find by receiver"
              className="rounded-xl border border-kagaz-gold/40 bg-white px-3 py-2 text-base"
            />
          )}
          {shown.map((l) => (
            <SentLink key={l.id} saved={l} passcode={passcode} onChange={(t) => setLinks((all) => all && all.map((x) => (x.id === l.id ? { ...x, t } : x)))} />
          ))}
        </div>
      )}
    </section>
  )
}

function SentLink({ saved, passcode, onChange }: { saved: Saved; passcode: string; onChange: (t: Record<string, string>) => void }) {
  const side = sideOf(saved.side)
  const parts = side?.parts ?? (Object.keys(LETTER) as PartKey[]).filter((k) => saved.t[LETTER[k]])
  const fromSheet = () => Object.fromEntries(parts.map((k) => [k, saved.t[LETTER[k]] ? colon(saved.t[LETTER[k]]) : DEFAULTS[k]])) as Record<PartKey, string>
  const [open, setOpen] = useState(false)
  const [times, setTimes] = useState(fromSheet)
  const [state, setState] = useState<'saving' | 'saved' | 'failed' | null>(null)
  const changed = parts.some((k) => times[k] !== fromSheet()[k])
  const made = new Date(saved.made)

  const store = async () => {
    setState('saving')
    try {
      const r = await callApi({ key: passcode, action: 'times', id: saved.id, times })
      if (r.ok) {
        onChange(r.t)
        setState('saved')
      } else setState('failed')
    } catch {
      setState('failed')
    }
  }

  return (
    <div className="rounded-2xl border border-kagaz-gold/40 bg-white/60 px-4 py-3">
      <button type="button" onClick={() => setOpen(!open)} className="flex w-full items-baseline justify-between gap-3 text-left">
        <span>
          <span className="block font-semibold">{saved.name || 'No receiver name'}</span>
          <span className="block text-sm opacity-70">
            {side?.label ?? saved.side}
            {!Number.isNaN(made.getTime()) && ` · ${made.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}`}
          </span>
        </span>
        <span className="shrink-0 text-right text-sm opacity-80">
          {parts.map((k) => (
            <span key={k} className="block">
              {sayTime(fromSheet()[k]).en}
            </span>
          ))}
        </span>
      </button>
      {open && (
        <div className="mt-3 grid gap-3 border-t border-kagaz-gold/30 pt-3">
          {parts.map((k) => (
            <div key={k} className="flex flex-col gap-2">
              <span className="font-semibold">{wedding.programme[k].title.en}</span>
              <TimePicker value={times[k]} onChange={(at) => (setTimes({ ...times, [k]: at }), setState(null))} label={`${saved.name} ${wedding.programme[k].title.en}`} />
            </div>
          ))}
          <div className="grid grid-cols-[1fr_auto] gap-2">
            <button
              type="button"
              disabled={!changed || state === 'saving'}
              onClick={store}
              className="rounded-xl bg-kagaz-ink px-4 py-2.5 font-semibold text-[#fbf1ec] disabled:opacity-40"
            >
              {state === 'saving' ? 'Saving…' : 'Save times'}
            </button>
            {saved.link && (
              <a href={saved.link} target="_blank" rel="noreferrer" className="rounded-xl border border-kagaz-gold/50 px-4 py-2.5 text-center font-semibold">
                Open
              </a>
            )}
          </div>
          {state === 'saved' && <p className="text-sm opacity-70">Saved ✓ The card now shows these times.</p>}
          {state === 'failed' && <p className="text-sm text-[#9a1b1b]">Couldn’t save: try again.</p>}
        </div>
      )}
    </div>
  )
}
