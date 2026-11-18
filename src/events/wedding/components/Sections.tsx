import type { ReactNode } from 'react'
import { useLang, type Pair } from '../../../lib/lang'
import archUrl from '../assets/arch.webp'
import bananaUrl from '../assets/banana-corner.webp'
import drapeUrl from '../assets/drape.webp'
import feetUrl from '../assets/feet.webp'
import kalashUrl from '../assets/kalash.webp'
import sindoorUrl from '../assets/sindoor-potey.webp'
import { invite } from '../invite'

// The wedding invite's pages, one column on the soft red lokta: the opening (brass bells hanging over a gold arch
// with the names, the bride's Banarasi draped at the top corners, banana leaves at the foot), the saptapadi, the
// day's programme (kalash), and the closing (sindoor box and potey). Painted pieces cut from design/wedding/*.jpeg.
// Sizes are in cqw (the column's width), so the words keep their place in the arch.

const bells = Object.entries(import.meta.glob<string>('../assets/bells/*.webp', { eager: true, import: 'default' }))
  .sort(([a], [b]) => a.localeCompare(b))
  .map(([, url]) => url)
// Four strands, long ones outside and short ones in, clear of the arch's peak: which painted strand (bells/1-5:
// 2 and 4 are the shorter), where it hangs across the column, how wide it's drawn, and where it is in its swing.
const STRANDS = [
  { strand: 0, left: 27, width: 6.4, delay: '0s' },
  { strand: 1, left: 39, width: 5.4, delay: '-1.3s' },
  { strand: 3, left: 61, width: 5.4, delay: '-2.1s' },
  { strand: 4, left: 73, width: 6.4, delay: '-0.7s' },
]

// ० to ९ for 0 to 9.
const nepaliDigits = (s: string) => s.replace(/\d/g, (d) => '०१२३४५६७८९'[Number(d)])

const caps = (en: boolean) => (en ? 'uppercase tracking-[0.2em]' : '')

// A thin gold rule with a small diamond (or a word) in the middle.
const Rule = ({ className = '', children }: { className?: string; children?: ReactNode }) => (
  <span aria-hidden={!children} className={`flex items-center gap-[0.6em] ${className}`}>
    <span className="h-px flex-1 bg-kagaz-gold/60" />
    {children ?? <span className="size-[0.35em] rotate-45 bg-kagaz-gold" />}
    <span className="h-px flex-1 bg-kagaz-gold/60" />
  </span>
)

// Banana leaves growing in from the two bottom corners.
const BananaCorners = ({ className = '' }: { className?: string }) => (
  <>
    <img src={bananaUrl} alt="" width={885} height={900} className={`sway-leaf pointer-events-none absolute bottom-0 left-0 w-[30cqw] origin-bottom-left ${className}`} />
    <span className={`pointer-events-none absolute right-0 bottom-0 w-[30cqw] -scale-x-100 ${className}`}>
      <img src={bananaUrl} alt="" width={885} height={900} className="sway-leaf block w-full origin-bottom-left" />
    </span>
  </>
)

// One of us in the arch: on the wedding card the full name, with whose son or daughter in brackets beneath; on the
// reception card just the first name, larger.
function Person({ who }: { who: 'groom' | 'bride' }) {
  const { lang, t } = useLang()
  const en = lang === 'en'
  if (!invite.showParents) return <p className={`font-names leading-none ${en ? 'text-[12cqw]' : 'text-[11cqw]'}`}>{t(invite.couple[who])}</p>
  return (
    <>
      <p className={`font-names leading-tight whitespace-nowrap ${en ? 'text-[7.6cqw]' : 'text-[8.5cqw]'}`}>{t(invite.fullNames[who])}</p>
      <p className={`mt-[1cqw] max-w-[90%] leading-snug text-balance opacity-80 ${en ? 'text-[3.1cqw] italic' : 'text-[3.2cqw]'}`}>({t(invite.parents[who])})</p>
    </>
  )
}

export function Hero() {
  const { lang, t } = useLang()
  const en = lang === 'en'
  return (
    <header className="relative h-[181cqw] overflow-hidden">
      {/* The bride's Banarasi, gathered at the two top corners. */}
      <img src={drapeUrl} alt="" width={412} height={900} className="drape pointer-events-none absolute top-0 left-0 w-[22cqw] origin-top-left" />
      <span className="pointer-events-none absolute top-0 right-0 w-[22cqw] -scale-x-100">
        <img src={drapeUrl} alt="" width={412} height={900} className="drape block w-full origin-top-left" />
      </span>
      {/* Brass bells on marigold strands, each swinging a little out of step. */}
      {STRANDS.map((s, i) => (
        <img
          key={i}
          src={bells[s.strand]}
          alt=""
          className="bell pointer-events-none absolute top-0 -translate-x-1/2"
          style={{ left: `${s.left}%`, width: `${s.width}cqw`, animationDelay: s.delay }}
        />
      ))}
      {/* The gold arch, the names inside it. */}
      <img src={archUrl} alt="" width={954} height={1400} className="absolute top-[36cqw] left-1/2 w-[80cqw] -translate-x-1/2" />
      <div className="absolute inset-x-[21%] top-[65cqw] h-[83cqw] flex flex-col items-center justify-center text-center text-kagaz-ink">
        <p className={`text-kagaz-gold ${caps(en)} ${en ? 'text-[3cqw]' : 'text-[4.4cqw] font-medium'}`}>{t(invite.kicker)}</p>
        <Rule className="mt-[2cqw] mb-[3.5cqw] w-[55%] text-[3cqw]" />
        <Person who={invite.partnerOne === invite.couple.groom ? 'groom' : 'bride'} />
        <p className={`my-[1.2cqw] font-display text-kagaz-gold ${en ? 'text-[6cqw] italic' : 'text-[5cqw]'}`}>{t(invite.and)}</p>
        <Person who={invite.partnerTwo === invite.couple.groom ? 'groom' : 'bride'} />
        <Rule className="mt-[3.5cqw] mb-[2.5cqw] w-[55%] text-[3cqw]" />
        <p className={`leading-snug text-balance ${en ? 'text-[3.6cqw] italic' : 'text-[3.8cqw]'}`}>{t(invite.invitation)}</p>
      </div>
      <BananaCorners />
    </header>
  )
}

export function Steps() {
  const { lang, t } = useLang()
  const en = lang === 'en'
  return (
    <section className="flex flex-col items-center px-[10%] pt-[10cqw] pb-[6cqw] text-center text-kagaz-ink">
      <h2 data-reveal className={`font-names leading-tight ${en ? 'text-[11cqw]' : 'text-[9cqw]'}`}>
        {t(invite.steps.heading)}
      </h2>
      <Rule className="mt-2 mb-[6cqw] w-[45%] text-[3.5cqw]" />
      <img data-reveal src={feetUrl} alt="" width={891} height={1100} className="fade-feet w-[62cqw]" />
      <p data-reveal className={`mt-[6cqw] leading-snug text-balance ${en ? 'text-[5cqw] italic' : 'text-[4.6cqw] font-medium'}`}>
        {t(invite.steps.line)}
      </p>
      <p data-reveal className={`mt-[3cqw] leading-snug text-balance opacity-80 ${en ? 'text-[4.2cqw] italic' : 'text-[3.9cqw]'}`}>
        {t(invite.steps.blessing)}
      </p>
    </section>
  )
}

const Pin = () => (
  <svg aria-hidden viewBox="0 0 24 24" className="size-4 fill-none stroke-kagaz-gold stroke-2">
    <path d="M12 21s-7-6.2-7-12a7 7 0 0 1 14 0c0 5.8-7 12-7 12Z" />
    <circle cx="12" cy="9" r="2.5" />
  </svg>
)

// A painted piece hanging on or perched at each card's edge (like the mehendi's peacock), once it's been made:
// assets/cards/<part>.webp (janti, ceremony, reception), cut by scripts/wedding/cut-chroma.py. Where each sits.
const CARD_ART = Object.fromEntries(
  Object.entries(import.meta.glob<string>('../assets/cards/*.webp', { eager: true, import: 'default' })).map(([path, url]) => [
    path.split('/').pop()!.replace('.webp', ''),
    url,
  ]),
)
// Where each sits (one entry per copy; `flip` mirrors it), and how much room the card leaves above for it.
const ART_PLACE: Record<string, { pieces: { at: string; flip?: boolean }[]; room: string }> = {
  janti: { pieces: [{ at: '-top-[19cqw] -left-[6cqw] w-[28cqw]' }], room: 'mt-[16cqw]' }, // naumati baja on the top-left corner
  // the gathbandhan knot tied along the top edge, its cloths fading out towards the corners
  ceremony: { pieces: [{ at: 'knot-band top-0 -inset-x-[6cqw]' }], room: 'pt-[23cqw]' },
  reception: { pieces: [{ at: 'stand -bottom-[4cqw] -right-[4cqw] w-[18cqw]' }], room: 'mb-[4cqw]' }, // a panas lamp at the bottom-right corner
}

type Part = { title: Pair; date: Pair; time: Pair; place: Pair; address: Pair; mapLink: string }

// One part of the day: its title, date and time, and where (with directions).
function PartCard({ part, art }: { part: Part; art: string }) {
  const { lang, t } = useLang()
  const en = lang === 'en'
  const place = part.mapLink ? (
    <a href={part.mapLink} target="_blank" rel="noreferrer" className="underline decoration-kagaz-gold/60 underline-offset-4">
      {t(part.place)}
    </a>
  ) : (
    t(part.place)
  )
  return (
    <div data-reveal className={`relative flex w-full flex-col items-center gap-1 rounded-3xl border border-kagaz-gold/30 bg-[#fbf1ec]/70 px-5 py-6 shadow-sm shadow-kagaz-ink/10 ${CARD_ART[art] ? (ART_PLACE[art]?.room ?? '') : ''}`}>
      {CARD_ART[art] &&
        ART_PLACE[art]?.pieces.map((piece, i) => (
          <span key={i} className={`pointer-events-none absolute ${piece.at} ${piece.flip ? '-scale-x-100' : ''}`}>
            <img src={CARD_ART[art]} alt="" className="card-art block w-full" />
          </span>
        ))}
      <h3 className={`font-names leading-tight ${en ? 'text-[8cqw]' : 'text-[6.4cqw]'}`}>{t(part.title)}</h3>
      <Rule className="mt-1 mb-3 w-[40%] text-[3cqw]" />
      {t(part.date) && <p className="text-lg leading-snug font-semibold">{t(part.date)}</p>}
      {t(part.time) && <p className="text-base leading-snug opacity-80">{t(part.time)}</p>}
      {t(part.place) && <p className="mt-3 text-lg leading-snug font-semibold">{place}</p>}
      {t(part.address) && <p className="text-base leading-snug opacity-80">{t(part.address)}</p>}
      {part.mapLink && (
        <a
          href={part.mapLink}
          target="_blank"
          rel="noreferrer"
          className={`mt-4 inline-flex items-center gap-2 rounded-full border border-kagaz-gold/60 bg-[#fbf1ec] px-4 py-1.5 text-sm shadow-sm shadow-kagaz-ink/10 transition-colors hover:bg-kagaz-gold/10 ${en ? 'tracking-[0.15em] uppercase' : 'font-medium'}`}
        >
          <Pin />
          {t(invite.details.directions)}
        </a>
      )}
    </div>
  )
}

export function Details() {
  const { lang, t } = useLang()
  const en = lang === 'en'
  const parts = invite.programme
  // A part with nothing filled in yet (the reception, say) waits off the page.
  const shown = invite.parts.map((key) => ({ key, part: parts[key] })).filter(({ part }) => t(part.date) || t(part.place))
  return (
    <section className="flex flex-col items-center px-[9%] pt-[8cqw] pb-[10cqw] text-center text-kagaz-ink">
      {/* The sindoor box and potey (on the wedding card only: they belong to the ceremony). */}
      {invite.showSindoor && <img data-reveal src={sindoorUrl} alt="" width={1100} height={621} className="mb-[4cqw] w-[66cqw]" />}
      <h2 data-reveal className={`font-names leading-tight ${en ? 'text-[11cqw]' : 'text-[9cqw]'}`}>
        {t(invite.details.heading)}
      </h2>
      <Rule className="mt-2 mb-[8cqw] w-[45%] text-[3.5cqw]" />
      <div className="flex w-full flex-col gap-8">
        {shown.map(({ key, part }) => (
          <PartCard key={key} part={part} art={key} />
        ))}
      </div>
    </section>
  )
}

export function Closing() {
  const { lang, t } = useLang()
  const en = lang === 'en'
  return (
    <footer className="relative flex min-h-[130cqw] flex-col items-center px-[10%] pt-[6cqw] pb-[36cqw] text-center text-kagaz-ink">
      <img data-reveal src={kalashUrl} alt="" width={743} height={900} className="w-[36cqw]" />
      <p data-reveal className={`mt-[6cqw] font-names leading-tight ${en ? 'text-[10cqw]' : 'text-[8cqw]'}`}>
        {t(invite.closing)}
      </p>
      <Rule className="mt-3 w-[40%] text-[3.5cqw]" />
      <p data-reveal className={`mt-[4cqw] ${en ? 'text-[4.6cqw] italic' : 'text-[4.2cqw] font-medium'}`}>{t(invite.familyLine)}</p>
      {/* This version's contact numbers, in Nepali digits when reading in Nepali (they still dial as written). */}
      {invite.contacts.length > 0 && (
        <div data-reveal className="mt-[10cqw] flex flex-col items-center gap-1">
          <p className={`text-kagaz-gold ${caps(en)} ${en ? 'text-xs' : 'text-sm font-medium'}`}>{t(invite.contactsHeading)}</p>
          <p className="flex flex-wrap justify-center gap-x-5 gap-y-1 text-lg font-semibold">
            {invite.contacts.map((phone: string) => (
              <a key={phone} href={`tel:${phone}`} className="underline decoration-kagaz-gold/60 underline-offset-4">
                {en ? phone : nepaliDigits(phone)}
              </a>
            ))}
          </p>
        </div>
      )}
      <BananaCorners />
    </footer>
  )
}
