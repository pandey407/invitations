// The times on the wedding and reception cards. Each part of the day has its time as "HH:MM" (24-hour) in
// content.ts; a link can carry other times (inside its #g= code, made by the link maker at /wedding/settings:
// src/envelope/guest.ts), and the card says them in words: "बिहान ८:३० बजे" / "8:30 AM", with "देखि" / "onwards"
// for a part that runs on (the reception).
// A link made by the link maker also carries an id, and its row in the guest sheet's "Sent links" tab can change the
// times after it's sent (useTimes).
import { useEffect, useState } from 'react'
import { readLink } from '../../envelope/guest'
import { savedRow } from '../../envelope/saved'
import type { Pair } from '../../lib/lang'

export type PartKey = 'janti' | 'ceremony' | 'reception'

// One letter per part in the link's code: { c: '1000', r: '1800' } (only the times that differ from the card's own).
const LETTER: Record<PartKey, string> = { janti: 'j', ceremony: 'c', reception: 'r' }

const nepaliDigits = (s: string) => s.replace(/\d/g, (d) => '०१२३४५६७८९'[Number(d)])

/** "08:30" → { np: 'बिहान ८:३० बजे', en: '8:30 AM' } (with "देखि" / " onwards" when `onwards`). */
export function sayTime(at: string, onwards = false): Pair {
  const [h, m] = at.split(':').map(Number)
  const h12 = h % 12 || 12
  const mm = String(m).padStart(2, '0')
  // Parts of the day as Nepali says them on a card.
  const period = h >= 4 && h < 12 ? 'बिहान' : h >= 12 && h < 16 ? 'दिउँसो' : h >= 16 && h < 19 ? 'साँझ' : 'राति'
  return {
    np: `${period} ${nepaliDigits(m ? `${h12}:${mm}` : `${h12}`)} बजे${onwards ? 'देखि' : ''}`,
    en: `${h12}:${mm} ${h < 12 ? 'AM' : 'PM'}${onwards ? ' onwards' : ''}`,
  }
}

export { fromLetters }

/** The times a link carries, by part: { ceremony: '10:00' }. Anything malformed is ignored. */
export function readTimes(where: string): Partial<Record<PartKey, string>> {
  return fromLetters(readLink(where).times)
}

function fromLetters(carried: Record<string, string>): Partial<Record<PartKey, string>> {
  const out: Partial<Record<PartKey, string>> = {}
  for (const key of Object.keys(LETTER) as PartKey[]) {
    const m = /^([01]\d|2[0-3])([0-5]\d)$/.exec(carried[LETTER[key]] ?? '')
    if (m) out[key] = `${m[1]}:${m[2]}`
  }
  return out
}

/** The times to put in a link's code, leaving out any that match the card's own: { c: '1000' }. */
export function timesForLink(times: Partial<Record<PartKey, string>>, defaults: Record<PartKey, string>) {
  return Object.fromEntries(
    (Object.keys(LETTER) as PartKey[]).filter((k) => times[k] && times[k] !== defaults[k]).map((k) => [LETTER[k], times[k]!.replace(':', '')]),
  )
}

/** This page's times by part: the link's own at once, then its saved row's (from the guest sheet) when they arrive. */
export function useTimes(savedLinksUrl: string) {
  const [times, setTimes] = useState(() => readTimes(location.search + location.hash))
  useEffect(() => {
    let live = true
    savedRow(savedLinksUrl).then((row) => live && row && setTimes((now) => ({ ...now, ...fromLetters(row.times) })))
    return () => {
      live = false
    }
  }, [savedLinksUrl])
  return times
}
