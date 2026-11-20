import { useEffect, useMemo, useState } from 'react'
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

// The links saved in the guest sheet's "Sent links" tab, newest first; change one and its card follows.
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
            <SentLink key={l.id} saved={l} passcode={passcode} onChange={(next) => setLinks((all) => all && all.map((x) => (x.id === l.id ? next : x)))} />
          ))}
        </div>
      )}
    </section>
  )
}

// What can be changed on a sent link; its card reads these from the guest sheet when it opens.
type Details = { name: string; chu: boolean; english: boolean; times: Record<PartKey, string> }
const same = (a: Details, b: Details, parts: readonly PartKey[]) =>
  a.name.trim() === b.name.trim() && a.chu === b.chu && a.english === b.english && parts.every((k) => a.times[k] === b.times[k])
// The sheet's answer ({n, c, l, t} or a list row) → Details, filling any missing time from what's shown now.
function detailsFrom(r: { n?: string; name?: string; c?: number; chu?: boolean; l?: string; english?: boolean; t?: Record<string, string> }, parts: readonly PartKey[], fallback: Details): Details {
  const t = fromLetters(r.t ?? {})
  return {
    name: String(r.n ?? r.name ?? fallback.name),
    chu: r.c !== undefined ? r.c === 1 : (r.chu ?? fallback.chu),
    english: r.l !== undefined ? r.l === 'en' : (r.english ?? fallback.english),
    times: Object.fromEntries(parts.map((k) => [k, t[k] ?? fallback.times[k]])) as Record<PartKey, string>,
  }
}

// Change a link's receiver name, चु: stamp, language and times, and save them to the guest sheet.
function Editor({
  initial,
  parts,
  save,
  passcode,
  openLink,
}: {
  initial: Details
  parts: readonly PartKey[]
  save: (d: Details, key: string) => Promise<{ ok: boolean; passcode?: boolean }>
  passcode: string
  openLink?: string
}) {
  const [d, setD] = useState(initial)
  const [typed, setTyped] = useState('')
  const [state, setState] = useState<'saving' | 'saved' | 'failed' | 'passcode' | null>(null)
  useEffect(() => setD(initial), [initial])
  const edit = (change: Partial<Details>) => {
    setD({ ...d, ...change })
    setState(null)
  }
  const key = passcode || typed.trim()
  const changed = !same(d, initial, parts)
  const store = async () => {
    setState('saving')
    try {
      const r = await save({ ...d, name: d.name.trim(), chu: d.chu && Boolean(d.name.trim()) }, key)
      setState(r.ok ? 'saved' : r.passcode ? 'passcode' : 'failed')
    } catch {
      setState('failed')
    }
  }
  return (
    <div className="grid gap-3">
      <div>
        <span className="mb-1 block text-sm font-semibold">Receiver</span>
        <input
          type="text"
          value={d.name}
          onChange={(e) => edit({ name: e.target.value })}
          maxLength={80}
          placeholder="No name on the envelope"
          className="w-full rounded-xl border border-kagaz-gold/40 bg-white px-3 py-2.5 text-base"
        />
      </div>
      <label className={`flex items-center gap-2 ${d.name.trim() ? '' : 'opacity-50'}`}>
        <input type="checkbox" checked={d.chu && Boolean(d.name.trim())} disabled={!d.name.trim()} onChange={(e) => edit({ chu: e.target.checked })} className="size-5 accent-kagaz-ink" />
        <span>चु: stamp (चुलेनिम्तो, the whole household)</span>
      </label>
      <label className="flex items-center gap-2">
        <input type="checkbox" checked={d.english} onChange={(e) => edit({ english: e.target.checked })} className="size-5 accent-kagaz-ink" />
        <span>Open in English</span>
      </label>
      {parts.map((k) => (
        <div key={k} className="flex flex-col gap-2">
          <div className="flex items-baseline justify-between gap-3">
            <span className="font-semibold">{wedding.programme[k].title.en}</span>
            <span className="text-sm opacity-75">{sayTime(d.times[k], wedding.programme[k].onwards).np}</span>
          </div>
          <TimePicker value={d.times[k]} onChange={(at) => edit({ times: { ...d.times, [k]: at } })} label={`${initial.name || 'Link'} ${wedding.programme[k].title.en}`} />
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
      <div className={`grid gap-2 ${openLink ? 'grid-cols-[1fr_auto]' : ''}`}>
        <button type="button" disabled={!changed || !key || state === 'saving'} onClick={store} className="rounded-xl bg-kagaz-ink px-4 py-2.5 font-semibold text-[#fbf1ec] disabled:opacity-40">
          {state === 'saving' ? 'Saving…' : 'Save changes'}
        </button>
        {openLink && (
          <a href={openLink} target="_blank" rel="noreferrer" className="rounded-xl border border-kagaz-gold/50 px-4 py-2.5 text-center font-semibold">
            Open
          </a>
        )}
      </div>
      {state === 'saved' && <p className="text-sm opacity-70">Saved ✓ The same link now opens with these.</p>}
      {state === 'failed' && <p className="text-sm text-[#9a1b1b]">Couldn’t save: try again.</p>}
      {state === 'passcode' && <p className="text-sm text-[#9a1b1b]">That passcode isn’t right.</p>}
    </div>
  )
}

const rememberKey = (key: string, passcode: string, setPasscode: (k: string) => void) => {
  if (passcode) return
  try {
    localStorage.setItem(KEY_STORE, key)
  } catch {
    // kept for this visit only
  }
  setPasscode(key)
}

function SentLink({ saved, passcode, onChange }: { saved: Saved; passcode: string; onChange: (s: Saved) => void }) {
  const side = sideOf(saved.side)
  const parts = useMemo(() => side?.parts ?? (Object.keys(LETTER) as PartKey[]).filter((k) => saved.t[LETTER[k]]), [side, saved.t])
  const [open, setOpen] = useState(false)
  const initial = useMemo(
    () => detailsFrom(saved, parts, { name: '', chu: false, english: false, times: { ...DEFAULTS, ...Object.fromEntries(parts.map((k) => [k, saved.t[LETTER[k]] ? colon(saved.t[LETTER[k]]) : DEFAULTS[k]])) } }),
    [saved, parts],
  )
  const made = new Date(saved.made)
  const save = async (d: Details, key: string) => {
    const r = await callApi({ key, action: 'set', id: saved.id, name: d.name, chu: d.chu, english: d.english, times: d.times })
    if (r.ok) onChange({ ...saved, name: String(r.n), chu: r.c === 1, english: r.l === 'en', t: r.t ?? {} })
    return { ok: Boolean(r.ok), passcode: r.error === 'passcode' }
  }

  return (
    <div className="rounded-2xl border border-kagaz-gold/40 bg-white/60 px-4 py-3">
      <button type="button" onClick={() => setOpen(!open)} className="flex w-full items-baseline justify-between gap-3 text-left">
        <span>
          <span className="block font-semibold">
            {saved.name || 'No receiver name'}
            {saved.chu && <span className="ml-1.5 text-kagaz-gold">चु:</span>}
          </span>
          <span className="block text-sm opacity-70">
            {side?.label ?? saved.side}
            {saved.english && ' · English'}
            {!Number.isNaN(made.getTime()) && ` · ${made.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}`}
          </span>
        </span>
        <span className="shrink-0 text-right text-sm opacity-80">
          {parts.map((k) => (
            <span key={k} className="block">
              {sayTime(initial.times[k]).en}
            </span>
          ))}
        </span>
      </button>
      {open && (
        <div className="mt-3 border-t border-kagaz-gold/30 pt-3">
          <Editor initial={initial} parts={parts} save={save} passcode={passcode} openLink={saved.link || undefined} />
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

type Pasted = { side: Side; key: string; details: Details; inSheet: boolean; link: string }

// Paste any personal link already sent (old ?g= ones too): see what it carries now, and change it. The change is
// kept in the guest sheet's "Sent links" tab under the link's id (or its whole code), which the card reads.
function PastedLink({ passcode, setPasscode, onSaved }: { passcode: string; setPasscode: (k: string) => void; onSaved: () => void }) {
  const [text, setText] = useState('')
  const [found, setFound] = useState<Pasted | null>(null)
  const [problem, setProblem] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setFound(null)
    setProblem(null)
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
    const fromLink: Details = {
      name: data.guest?.name ?? '',
      chu: data.guest?.chu ?? false,
      english: data.lang === 'en',
      times: Object.fromEntries(parts.map((k) => [k, carried[k] ?? DEFAULTS[k]])) as Record<PartKey, string>,
    }
    let live = true
    setLoading(true)
    fetch(`${API}?id=${encodeURIComponent(key)}`)
      .then((r) => r.json())
      .catch(() => ({}))
      .then((d) => {
        if (!live) return
        const inSheet = Boolean(d && d.t)
        setFound({ side, key, details: inSheet ? detailsFrom(d, parts, fromLink) : fromLink, inSheet, link: raw })
        setLoading(false)
      })
    return () => {
      live = false
    }
  }, [text])

  const parts = found ? SIDES.find((s) => s.key === found.side)!.parts : []
  const save = async (d: Details, key: string) => {
    if (!found) return { ok: false }
    const r = await callApi({ key, action: 'set', id: found.key, side: found.side, name: d.name, chu: d.chu, english: d.english, times: d.times, link: found.link })
    if (r.ok) {
      rememberKey(key, passcode, setPasscode)
      setFound({ ...found, details: detailsFrom(r, parts, d), inSheet: true })
      onSaved()
    }
    return { ok: Boolean(r.ok), passcode: r.error === 'passcode' }
  }

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
      {loading && <p className="mt-2 text-sm opacity-70">Looking it up…</p>}
      {found && (
        <div className="mt-3 grid gap-3">
          <p className="text-sm opacity-75">
            {SIDES.find((s) => s.key === found.side)!.label} · {found.inSheet ? 'changed before (from Sent links)' : 'as sent'}
          </p>
          <Editor initial={found.details} parts={parts} save={save} passcode={passcode} openLink={found.link} />
        </div>
      )}
    </section>
  )
}
