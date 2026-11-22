// Which event and side this URL is (see src/events/index.ts); null on the bare domain or unknown paths.
import { fromPath, resolve } from './events'

// Links already sent to the wrong card: their code (after #g= or ?g=) → the page they should open. The link keeps its
// code, so the guest's name and चु: still show; history.replaceState just moves it before anything is drawn.
const MOVED: Record<string, string> = {
  // श्रीमान् नरेश पौडेल ज्यू: sent the reception-only card, invited to the wedding too.
  'eyJuIjoi4KS24KWN4KSw4KWA4KSu4KS-4KSo4KWNIOCkqOCksOClh-CktiDgpKrgpYzgpKHgpYfgpLIg4KSc4KWN4KSv4KWCIiwiYyI6MX0': '/wedding/',
}
const code = /[?#&]g=([A-Za-z0-9_-]+)/.exec(location.search + location.hash)?.[1]
const moveTo = code && MOVED[code]
if (moveTo && location.pathname !== moveTo) history.replaceState(null, '', moveTo + location.search + location.hash)

export const route = fromPath(location.pathname)

// A moved link's tab title is the page it moved to (the HTML it loaded has the old page's).
if (moveTo && route) document.title = resolve(route.event, route.side).meta.title
