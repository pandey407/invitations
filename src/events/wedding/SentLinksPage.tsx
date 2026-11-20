import { useEffect, useState, type ReactNode } from 'react'
import { readLink, savedKey } from '../../envelope/guest'
import { reception } from '../reception/content'
import { wedding } from './content'
import { API, callApi, colon, DEFAULTS, KEY_STORE, Label, LETTER, readKey, SIDES, TimePicker, usePageLook, type Saved, type Side } from './Settings'
import { fromLetters, sayTime, type PartKey } from './times'

// Sent links (/wedding/settings/sent, reached from the link maker): paste a link already sent to see what it
// carries and change its times, and browse every link the maker has saved. All kept in the guest sheet's
// "Sent links" tab through its web app (scripts/wedding/sent-links.gs); a card opened from the link reads its row.

export default function SentLinksPage() {
  usePageLook('Sent links')
  const [key, setKey] = useState(readKey)
  const [version, setVersion] = useState(0)
  return (
    <main className="mx-auto flex min-h-svh w-full max-w-md flex-col gap-6 px-4 py-8 text-kagaz-ink">
      <header className="text-center">
        <a href="/wedding/settings/" className="text-sm underline decoration-kagaz-gold/60 underline-offset-4">← Invite link maker</a>
        <h1 className="mt-2 font-names text-4xl">Sent links</h1>
        <p className="mt-1 text-sm opacity-70">अस्लेष र आरुषा · शुभ विवाह</p>
      </header>
      {API ? (
        <>
          <PastedLink passcode={key} setPasscode={setKey} onSaved={() => setVersion((v) => v + 1)} />
          <SentLinks passcode={key} setPasscode={setKey} version={version} />
        </>
      ) : (
        <p className="text-center text-sm opacity-70">The guest sheet’s web app isn’t set up (savedLinks in content.ts).</p>
      )}
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
        <p className="text-sm opacity-70">None yet: links you copy, share or open in the link maker are saved here.</p>
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

// Which side a pasted link is from, by its path: /wedding/aarusha/ (bride), /reception/, else /wedding/ (groom).
function sideOfPath(path: string): Side | null {
  const p = path.replace(/^\/+|\/+$/g, '')
  if (p === `wedding/${wedding.sides.bride.path}`) return 'bride'
  if (p === reception.slug) return 'reception'
  if (p === 'wedding') return 'groom'
  return null
}

type Pasted = { side: Side; key: string; name: string; chu: boolean; english: boolean; times: Record<PartKey, string>; inSheet: boolean; link: string }

// Paste any personal link already sent (old ?g= ones too): see what it carries, and change its times. The change is
// kept in the guest sheet's "Sent links" tab under the link's id (or its whole code), which the card reads.
function PastedLink({ passcode, setPasscode, onSaved }: { passcode: string; setPasscode: (k: string) => void; onSaved: () => void }) {
  const [typed, setTyped] = useState('')
  const [text, setText] = useState('')
  const [found, setFound] = useState<Pasted | null>(null)
  const [times, setTimes] = useState<Record<PartKey, string> | null>(null)
  const [problem, setProblem] = useState<string | null>(null)
  const [state, setState] = useState<'loading' | 'saving' | 'saved' | 'failed' | 'passcode' | null>(null)

  useEffect(() => {
    setFound(null)
    setTimes(null)
    setProblem(null)
    setState(null)
    const raw = text.trim()
    if (!raw) return
    let url: URL
    try {
      url = new URL(raw)
    } catch {
      setProblem('That isn’t a link.')
      return
    }
    const side = sideOfPath(url.pathname)
    const data = readLink(url.search + url.hash)
    const key = savedKey(data)
    if (!side) return setProblem('That isn’t a wedding or reception invite link.')
    if (!key) return setProblem('That’s the plain card (no guest code), so there’s nothing personal to change.')
    const parts = SIDES.find((s) => s.key === side)!.parts
    const carried = fromLetters(data.times)
    const base = Object.fromEntries(parts.map((k) => [k, carried[k] ?? DEFAULTS[k]])) as Record<PartKey, string>
    let live = true
    setState('loading')
    fetch(`${API}?id=${encodeURIComponent(key)}`)
      .then((r) => r.json())
      .catch(() => ({}))
      .then((d) => {
        if (!live) return
        const saved = d && d.t ? fromLetters(d.t) : {}
        const now = { ...base, ...Object.fromEntries(parts.filter((k) => saved[k]).map((k) => [k, saved[k]])) } as Record<PartKey, string>
        setFound({ side, key, name: data.guest?.name ?? '', chu: data.guest?.chu ?? false, english: data.lang === 'en', times: now, inSheet: Boolean(d && d.t), link: raw })
        setTimes(now)
        setState(null)
      })
    return () => {
      live = false
    }
  }, [text])

  const parts = found ? SIDES.find((s) => s.key === found.side)!.parts : []
  const changed = Boolean(found && times && parts.some((k) => times[k] !== found.times[k]))
  const store = async () => {
    if (!found || !times) return
    const key = passcode || typed.trim()
    if (!key) return
    setState('saving')
    try {
      const r = await callApi({ key, action: 'set', id: found.key, side: found.side, name: found.name, chu: found.chu, english: found.english, times, link: found.link })
      if (r.ok) {
        const now = { ...times, ...fromLetters(r.t ?? {}) }
        setFound({ ...found, times: now, inSheet: true })
        setTimes(now)
        setState('saved')
        if (!passcode) {
          try {
            localStorage.setItem(KEY_STORE, key)
          } catch {
            // kept for this visit only
          }
          setPasscode(key)
        }
        onSaved()
      } else setState(r.error === 'passcode' ? 'passcode' : 'failed')
    } catch {
      setState('failed')
    }
  }

  const Row = ({ label, children }: { label: string; children: ReactNode }) => (
    <div className="flex items-baseline justify-between gap-3 border-b border-kagaz-gold/20 py-1.5 text-sm last:border-0">
      <span className="opacity-70">{label}</span>
      <span className="text-right font-semibold">{children}</span>
    </div>
  )

  return (
    <section className="rounded-3xl border border-kagaz-gold/30 bg-[#fbf1ec]/80 p-5 shadow-sm shadow-kagaz-ink/10">
      <Label>Change a sent link</Label>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={2}
        placeholder="Paste a link you sent"
        className="w-full resize-none rounded-xl border border-kagaz-gold/40 bg-white px-3 py-2.5 font-mono text-sm"
      />
      {problem && <p className="mt-2 text-sm text-[#9a1b1b]">{problem}</p>}
      {state === 'loading' && <p className="mt-2 text-sm opacity-70">Looking it up…</p>}
      {found && times && (
        <div className="mt-3 grid gap-3">
          <div className="rounded-2xl border border-kagaz-gold/40 bg-white/60 px-4 py-2">
            <Row label="Side">{SIDES.find((s) => s.key === found.side)!.label}</Row>
            <Row label="Receiver">{found.name || '—'}</Row>
            <Row label="चु: stamp">{found.chu ? 'Yes' : 'No'}</Row>
            <Row label="Opens in">{found.english ? 'English' : 'Nepali'}</Row>
            {parts.map((k) => (
              <Row key={k} label={wedding.programme[k].title.en}>
                {sayTime(found.times[k]).en}
              </Row>
            ))}
            <Row label="Changed before">{found.inSheet ? 'Yes, in Sent links' : 'No'}</Row>
          </div>
          {parts.map((k) => (
            <div key={k} className="flex flex-col gap-2">
              <span className="font-semibold">{wedding.programme[k].title.en}</span>
              <TimePicker value={times[k]} onChange={(at) => (setTimes({ ...times, [k]: at }), setState(null))} label={`Pasted link ${wedding.programme[k].title.en}`} />
            </div>
          ))}
          {!passcode && (
            <input
              type="password"
              value={typed}
              onChange={(e) => (setTyped(e.target.value), setState(null))}
              placeholder="Passcode (to save)"
              className="rounded-xl border border-kagaz-gold/40 bg-white px-3 py-2.5 text-base"
            />
          )}
          <div className="grid grid-cols-[1fr_auto] gap-2">
            <button type="button" disabled={!changed || state === 'saving' || !(passcode || typed.trim())} onClick={store} className="rounded-xl bg-kagaz-ink px-4 py-2.5 font-semibold text-[#fbf1ec] disabled:opacity-40">
              {state === 'saving' ? 'Saving…' : 'Save times'}
            </button>
            <a href={found.link} target="_blank" rel="noreferrer" className="rounded-xl border border-kagaz-gold/50 px-4 py-2.5 text-center font-semibold">
              Open
            </a>
          </div>
          {state === 'saved' && <p className="text-sm opacity-70">Saved ✓ The same link now shows these times.</p>}
          {state === 'failed' && <p className="text-sm text-[#9a1b1b]">Couldn’t save: try again.</p>}
          {state === 'passcode' && <p className="text-sm text-[#9a1b1b]">That passcode isn’t right.</p>}
          <p className="text-xs opacity-60">The name, चु: and language are part of the link itself; to change those, make a new link in the link maker.</p>
        </div>
      )}
    </section>
  )
}
