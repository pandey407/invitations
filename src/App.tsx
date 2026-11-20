import { lazy, Suspense, useEffect, useState, type ComponentType } from 'react'
import { LangProvider } from './components/LangProvider'
import { Envelope } from './envelope/Envelope'
import { readGuest } from './envelope/guest'
import { savedRow } from './envelope/saved'
import { resolve, type Side } from './events'
import { route } from './route'

// The shell: events with a shloka open with an envelope (their own src/events/<event>/Envelope.tsx if they have
// one, else the shared src/envelope); the invite itself is each event's own design (src/events/<event>/Invite.tsx),
// loaded only on that event's pages.
type InvitePage = ComponentType<{ opened: boolean; revealing: boolean }>
const pages = import.meta.glob<{ default: InvitePage }>('./events/*/Invite.tsx')
const envelopes = Object.fromEntries(
  Object.entries(import.meta.glob<{ default: typeof Envelope }>('./events/*/Envelope.tsx', { eager: true })).map(([path, m]) => [path.split('/')[2], m.default]),
)
const lazyPages: Record<string, InvitePage> = Object.fromEntries(
  Object.entries(pages).map(([path, load]) => [path.split('/')[2], lazy(load)]),
)

// Our own tools, not invites: the wedding's link maker and its sent links.
const tools: Record<string, ComponentType> = {
  '/wedding/settings': lazy(() => import('./events/wedding/Settings.tsx')),
  '/wedding/settings/sent': lazy(() => import('./events/wedding/SentLinksPage.tsx')),
}

export default function App() {
  const Tool = tools[location.pathname.replace(/\/+$/, '')]
  if (Tool)
    return (
      <Suspense fallback={null}>
        <Tool />
      </Suspense>
    )
  // Only event paths (/engagement, /engagement/aarusha, …) show an invite; the bare domain shows nothing.
  if (!route || !lazyPages[route.event]) return <main className="min-h-svh" />
  return <Shell event={route.event} side={route.side} />
}

function Shell({ event, side }: { event: string; side: Side }) {
  const text = resolve(event, side)
  const Page = lazyPages[event]
  const EventEnvelope = envelopes[event] ?? Envelope
  // Events without a shloka have no envelope; ?open skips it (handy for testing or a direct link to the details).
  const hasEnvelope = 'shloka' in text
  const [opened, setOpened] = useState(() => !hasEnvelope || new URLSearchParams(location.search).has('open'))
  // The invite's fade-ups start as the envelope *begins* to open, so it rises into view between the flaps.
  const [revealing, setRevealing] = useState(opened)
  // A link changed after it was sent (its row in the guest sheet: src/envelope/saved.ts) shows the changed name.
  const savedLinks = (text as { savedLinks?: string }).savedLinks
  const [guest, setGuest] = useState(() => readGuest(location.search + location.hash))
  useEffect(() => {
    let live = true
    savedRow(savedLinks).then((row) => live && row && setGuest(row.guest))
    return () => {
      live = false
    }
  }, [savedLinks])

  return (
    <LangProvider savedLinks={savedLinks}>
      {!opened && hasEnvelope && (
        <EventEnvelope
          shloka={text.shloka}
          invocation={text.invocation}
          openLabel={text.openLabel}
          guest={guest}
          onOpenStart={() => setRevealing(true)}
          onOpen={() => setOpened(true)}
        />
      )}
      <Suspense fallback={null}>
        <Page opened={opened} revealing={revealing} />
      </Suspense>
    </LangProvider>
  )
}
