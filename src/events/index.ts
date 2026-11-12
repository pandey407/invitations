// Event registry and routing: /<event>[/<side>] → the invite text for that event and side.
// Pure data (no browser APIs), so the build (vite.config.ts) and scripts can use it too.
import { engagement } from './engagement/content.ts'
import { mehendi } from './mehendi/content.ts'

export const events = [engagement, mehendi]
export type Event = (typeof events)[number]
export type Side = 'both' | 'bride' | 'groom'
// An event links only the sides it lists (every event has `both`, its bare path).
const sidesOf = (e: Event) => Object.keys(e.sides) as Side[]
const sideInfo = <E extends Event>(e: E, side: Side): E['sides']['both'] => (e.sides as Record<string, E['sides']['both']>)[side] ?? e.sides.both

/** Every page to publish: /engagement/, /engagement/aarusha/, … */
export function routes() {
  return events.flatMap((e) =>
    sidesOf(e).map((side) => {
      const sub = sideInfo(e, side).path
      return { event: e.slug, side, path: `/${e.slug}/${sub ? `${sub}/` : ''}` }
    }),
  )
}

/** Match a URL path to an event and side (null for anything else, e.g. the bare domain). */
export function fromPath(pathname: string) {
  const [slug, sub = ''] = pathname.split('/').filter(Boolean)
  const e = events.find((x) => x.slug === slug)
  if (!e) return null
  const side = sidesOf(e).find((s) => sideInfo(e, s).path === sub)
  return side ? { event: e.slug, side } : null
}

/** The invite for one event + side: names in that side's order, its sign-off, and page meta. */
export function resolve(slug: string, side: Side) {
  return invite(events.find((x) => x.slug === slug) ?? events[0], side)
}

/** Same, typed to one event's own text (each event's page uses this). */
export function invite<E extends Event>(e: E, side: Side) {
  const s = sideInfo(e, side)
  const [first, second] = (s.first as string) === 'groom' ? [e.couple.groom, e.couple.bride] : [e.couple.bride, e.couple.groom]
  const path = `${e.slug}/${s.path ? `${s.path}/` : ''}`
  // An event for one of the couple (`only`, e.g. the bride's mehendi) is titled "<name>'s <occasion>".
  const only = (e as { only?: 'bride' | 'groom' }).only
  const solo = only && e.couple[only]
  // An event with its own `name` (the mehendi's "Henna Hues") leads its titles with it.
  const name = (e as { name?: string }).name
  const named = (title: string) => (name ? `${name} · ${title}` : title)
  const titles = solo
    ? {
        title: named(`${solo.np}को ${e.occasion.np}`),
        previewTitle: named(`${solo.np}को ${e.occasion.np} · ${solo.en}'s ${e.occasion.en}`),
        description: `Join us for ${solo.en}'s ${e.occasion.en.toLowerCase()}!`,
      }
    : {
        title: named(`${first.np} ${e.and.np} ${second.np} · ${e.occasion.np}`),
        previewTitle: named(`${first.np} ${e.and.np} ${second.np} · ${first.en} & ${second.en}'s ${e.occasion.en}`),
        description: `Join us as we celebrate the ${e.occasion.en.toLowerCase()} of ${first.en} & ${second.en}.`,
      }
  return {
    ...e,
    side,
    partnerOne: first,
    partnerTwo: second,
    ...s, // that side's path, name order and (if the event has one) its sign-off line
    meta: {
      ...titles,
      url: e.siteUrl + path,
      image: `${e.siteUrl}previews/${e.slug}-${side}.jpg`,
      // The browser-tab icon and toolbar colour: the event's own, or the engagement's red and marigold.
      icon: `/${(e as { icon?: string }).icon ?? 'favicon.svg'}`,
      theme: (e as { themeColor?: string }).themeColor ?? '#77142a',
    },
  }
}
export type Invite = ReturnType<typeof resolve>
