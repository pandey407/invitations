// Who an invite link is addressed to: the guest's name for the envelope, and whether it is a चुलेनिम्तो (the
// whole household is invited: a gold "चु:" stamp on the envelope). Carried in the link itself (?g=…), so no guest
// list is published with the site. Pure (no browser APIs) so scripts can make the links too.
export type Guest = { name: string; chu: boolean }

// base64url of UTF-8 JSON {n, c}: short, survives WhatsApp, and doesn't read as a name in the address bar.
const toB64 = (s: string) => btoa(String.fromCharCode(...new TextEncoder().encode(s))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
const fromB64 = (s: string) => new TextDecoder().decode(Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/')), (c) => c.charCodeAt(0)))

export function guestParam({ name, chu }: Guest) {
  return toB64(JSON.stringify(chu ? { n: name, c: 1 } : { n: name }))
}

export function readGuest(search: string): Guest | null {
  const g = new URLSearchParams(search).get('g')
  if (!g) return null
  try {
    const { n, c } = JSON.parse(fromB64(g))
    return typeof n === 'string' && n.trim() ? { name: n.trim().slice(0, 80), chu: c === 1 } : null
  } catch {
    return null // a mangled link still opens the invite, just without a name
  }
}
