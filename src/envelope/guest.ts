// What a personal invite link carries, all in one code (?g=…) so none of it is readable in the address bar and no
// guest list is published with the site:
//   n  the guest's name for the envelope            c  1 for a चुलेनिम्तो (the whole household: a gold "चु:" stamp)
//   t  times that differ from the card's own, by part letter: { c: '1030', r: '1800' } (src/events/wedding/times.ts)
//   l  'en' to open in English
// The guest-list sheet (scripts/wedding/invite-links.gs) makes {n, c}; the link maker (/wedding/settings) can add t
// and l, and may leave out the name. Pure (no browser APIs) so scripts can make the links too.
export type Guest = { name: string; chu: boolean }
export type LinkData = { guest: Guest | null; times: Record<string, string>; lang: 'en' | null }

// base64url of UTF-8 JSON: short, survives WhatsApp, and doesn't read as anything in the address bar.
const toB64 = (s: string) => btoa(String.fromCharCode(...new TextEncoder().encode(s))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
const fromB64 = (s: string) => new TextDecoder().decode(Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/')), (c) => c.charCodeAt(0)))

/** The ?g= code for a link (empty when there's nothing to carry). */
export function linkParam({ name = '', chu = false, times = {}, english = false }: { name?: string; chu?: boolean; times?: Record<string, string>; english?: boolean }) {
  const data: Record<string, unknown> = {}
  if (name.trim()) data.n = name.trim()
  if (name.trim() && chu) data.c = 1
  if (Object.keys(times).length) data.t = times
  if (english) data.l = 'en'
  return Object.keys(data).length ? toB64(JSON.stringify(data)) : ''
}

/** Just the guest (what the sheet's links carry). */
export const guestParam = ({ name, chu }: Guest) => linkParam({ name, chu })

/** Everything a link carries; a missing or mangled code still opens the invite, just plainly. */
export function readLink(search: string): LinkData {
  const empty: LinkData = { guest: null, times: {}, lang: null }
  const g = new URLSearchParams(search).get('g')
  if (!g) return empty
  try {
    const { n, c, t, l } = JSON.parse(fromB64(g))
    const times = t && typeof t === 'object' ? Object.fromEntries(Object.entries(t).filter(([, v]) => typeof v === 'string')) : {}
    return {
      guest: typeof n === 'string' && n.trim() ? { name: n.trim().slice(0, 80), chu: c === 1 } : null,
      times: times as Record<string, string>,
      lang: l === 'en' ? 'en' : null,
    }
  } catch {
    return empty
  }
}

export const readGuest = (search: string) => readLink(search).guest
