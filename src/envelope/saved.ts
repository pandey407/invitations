import { readLink, savedKey, type Guest } from './guest'

// A personal link's row in the guest sheet's "Sent links" tab (scripts/wedding/sent-links.gs), if it has one: the
// details changed after the link was sent (the receiver's name, the चु: stamp, the language, the times), which win
// over what the link itself carries. Fetched once per page, by the link's id (or, for a link made before ids, its
// code); null when there's no row, no web app, or no answer.
export type SavedRow = { guest: Guest | null; lang: 'en' | 'np' | null; times: Record<string, string> }

let pending: Promise<SavedRow | null> | null = null

export function savedRow(url: string | undefined): Promise<SavedRow | null> {
  if (pending) return pending
  const key = savedKey(readLink(location.search + location.hash))
  if (!url || !key) return (pending = Promise.resolve(null))
  pending = fetch(`${url}?id=${encodeURIComponent(key)}`)
    .then((r) => r.json())
    .then((d): SavedRow | null => {
      if (!d || d.error || typeof d !== 'object') return null
      const name = typeof d.n === 'string' ? d.n.trim().slice(0, 80) : ''
      return {
        guest: name ? { name, chu: d.c === 1 } : null,
        lang: d.l === 'en' || d.l === 'np' ? d.l : null,
        times: d.t && typeof d.t === 'object' ? Object.fromEntries(Object.entries(d.t).filter(([, v]) => typeof v === 'string')) as Record<string, string> : {},
      }
    })
    .catch(() => null)
  return pending
}
