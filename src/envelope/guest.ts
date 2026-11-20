// What a personal invite link carries, all in one code (#g=…) so none of it is readable in the address bar and no
// guest list is published with the site:
//   n  the guest's name for the envelope            c  1 for a चुलेनिम्तो (the whole household: a gold "चु:" stamp)
//   t  times that differ from the card's own, by part letter: { c: '1030', r: '1800' } (src/events/wedding/times.ts)
//   l  'en' to open in English
//   i  the link's id in the guest sheet's "Sent links" tab, whose times win when it can be reached (savedTimes)
// The guest-list sheet (scripts/wedding/invite-links.gs) makes {n, c, t}; the link maker (/wedding/settings) can also
// add l, and may leave out the name. Pure (no browser APIs) so scripts can make the links too.
export type Guest = { name: string; chu: boolean }
export type LinkData = { guest: Guest | null; times: Record<string, string>; lang: 'en' | null; id: string | null }

// base64url of UTF-8 JSON: short, survives WhatsApp, and doesn't read as anything in the address bar.
const toB64 = (s: string) => btoa(String.fromCharCode(...new TextEncoder().encode(s))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
const fromB64 = (s: string) => new TextDecoder().decode(Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/')), (c) => c.charCodeAt(0)))

/** The #g= code for a link (empty when there's nothing to carry). */
export function linkParam({ name = '', chu = false, times = {}, english = false, id = '' }: { name?: string; chu?: boolean; times?: Record<string, string>; english?: boolean; id?: string }) {
  const data: Record<string, unknown> = {}
  if (name.trim()) data.n = name.trim()
  if (name.trim() && chu) data.c = 1
  if (Object.keys(times).length) data.t = times
  if (english) data.l = 'en'
  if (id) data.i = id
  return Object.keys(data).length ? toB64(JSON.stringify(data)) : ''
}

/** Just the guest (what the sheet's links carry). */
export const guestParam = ({ name, chu }: Guest) => linkParam({ name, chu })

// Links already sent that need a change: the code as sent → what it should carry instead (a sent link can't be edited).
const CORRECTIONS: Record<string, Record<string, unknown>> = {
  // To CCU 1 Family (bride's side): sent with the ceremony at 11:00, it's at 10:00.
  eyJuIjoiVG8gQ0NVIDEgRmFtaWx5IiwidCI6eyJjIjoiMTEwMCJ9LCJsIjoiZW4ifQ: { n: 'To CCU 1 Family', t: { c: '1000' }, l: 'en' },
}

/** Everything a link carries; a missing or mangled code still opens the invite, just plainly. */
// The code rides after a # (…/wedding/#g=…): browsers never send that part, so to Facebook and other link previewers
// every personal link is the same page, whose preview they already have (Messenger only shows previews it has).
// Older links have it as ?g=…, which still works. `where` is location.search + location.hash.
export function readLink(where: string): LinkData {
  const empty: LinkData = { guest: null, times: {}, lang: null, id: null }
  const g = /[?#&]g=([A-Za-z0-9_-]+)/.exec(where)?.[1]
  if (!g) return empty
  try {
    const { n, c, t, l, i } = CORRECTIONS[g] ?? JSON.parse(fromB64(g))
    const times = t && typeof t === 'object' ? Object.fromEntries(Object.entries(t).filter(([, v]) => typeof v === 'string')) : {}
    return {
      guest: typeof n === 'string' && n.trim() ? { name: n.trim().slice(0, 80), chu: c === 1 } : null,
      times: times as Record<string, string>,
      lang: l === 'en' ? 'en' : null,
      id: typeof i === 'string' && /^[A-Za-z0-9]{4,16}$/.test(i) ? i : null,
    }
  } catch {
    return empty
  }
}

export const readGuest = (where: string) => readLink(where).guest
