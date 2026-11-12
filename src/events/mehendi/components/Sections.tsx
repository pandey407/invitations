import { useState, type ReactNode } from 'react'
import { useLang, type Pair } from '../../../lib/lang'
import bloomUrl from '../assets/bloom-corner.webp'
import closingUrl from '../assets/closing.webp'
import detailsUrl from '../assets/details.webp'
import heroUrl from '../assets/hero.webp'
import peacockUrl from '../assets/peacock.webp'
import { invite } from '../invite'

// Three painted scenes of one Mughal garden, stacked down the page: the arch alcove (hero), plaster with blooms
// trailing down its edges (details), and the chhatri terrace with the peacock (closing). The text sits in each
// scene's open space. Sizes are in cqw (the page column's width) so the words keep their place in the painting.
// Type is kept classic: one deep leaf green, a flowing script for the big words, a serif for everything else.

// Small spaced capitals; Devanagari has no capitals and letter-spacing breaks its conjuncts, so it just goes plain.
const caps = (en: boolean) => (en ? 'uppercase tracking-[0.2em]' : '')

// A thin gold rule, with a small mark (or a word, like "of") in the middle.
const Rule = ({ className = '', children }: { className?: string; children?: ReactNode }) => (
  <span aria-hidden={!children} className={`flex items-center gap-[0.6em] ${className}`}>
    <span className="h-px flex-1 bg-gold/70" />
    {children ?? <span className="size-[0.35em] rotate-45 bg-gold" />}
    <span className="h-px flex-1 bg-gold/70" />
  </span>
)

export function Hero() {
  const { lang, t } = useLang()
  const en = lang === 'en'
  const occasion = (
    <>
      <h1 className={`font-script ${en ? 'text-[13cqw] leading-[0.9]' : 'text-[10.5cqw] leading-[1.15] font-bold'}`}>
        {t(invite.headline[0])}
        <br />
        {t(invite.headline[1])}
      </h1>
      <p className={`mt-[2.5cqw] ${caps(en)} ${en ? 'text-[3cqw]' : 'text-[3.6cqw] font-medium'}`}>{t(invite.ceremony)}</p>
    </>
  )
  return (
    <header className="relative">
      <img src={heroUrl} alt="" className="fade-bottom block w-full" />
      {/* Inside the arch's cream window. */}
      <div className="absolute inset-x-[28.5%] top-[25%] bottom-[19%] flex flex-col items-center justify-center text-center text-leaf">
        <p className={`${caps(en)} ${en ? 'text-[2.1cqw]' : 'text-[3.2cqw]'}`}>{t(invite.kicker)}</p>
        <Rule className="my-[2.5cqw] w-[55%] text-[3cqw]" />
        {en ? (
          // With great joy, we invite you to / Henna Hues / Mehendi & Sangeet / of / Aarusha
          <>
            <p className="mb-[3cqw] text-[3.3cqw] leading-snug italic">{t(invite.invitation)}</p>
            {occasion}
            <Rule className="my-[2cqw] w-[70%] text-[3.4cqw] italic">{t(invite.of)}</Rule>
            <p className="font-script text-[11cqw] leading-none">{t(invite.couple.bride)}</p>
          </>
        ) : (
          // आरुषाको / मेहन्दीका रंग / मेहन्दी र संगीत उत्सवमा / हार्दिक निमन्त्रणा
          <>
            <p className="font-script text-[7cqw] font-bold">
              {t(invite.couple.bride)}
              {t(invite.possessive)}
            </p>
            {occasion}
            <Rule className="my-[2cqw] w-[55%] text-[3cqw]" />
            <p className="text-[3.6cqw] leading-snug">{t(invite.invitation)}</p>
          </>
        )}
        <p className={`mt-[2.5cqw] max-w-[88%] leading-snug text-balance ${en ? 'text-[3cqw] italic' : 'text-[3.2cqw]'}`}>{t(invite.tagline)}</p>
      </div>
    </header>
  )
}

function Label({ text }: { text: Pair }) {
  const { lang, t } = useLang()
  return <p className={`mb-1 text-gold ${lang === 'en' ? 'text-xs tracking-[0.25em] uppercase' : 'text-sm font-medium'}`}>{t(text)}</p>
}

function Line({ children, strong }: { children: ReactNode; strong?: boolean }) {
  return <p className={strong ? 'text-lg leading-snug font-semibold' : 'text-base leading-snug opacity-80'}>{children}</p>
}

// Music notes drifting up from the dancing-shoes badge, staggered so one is always rising.
const NOTES = [
  { glyph: '♪', left: '8%', size: '1.1rem', delay: '0s' },
  { glyph: '♫', left: '30%', size: '1.35rem', delay: '1.1s' },
  { glyph: '♪', left: '62%', size: '1rem', delay: '2.2s' },
  { glyph: '♫', left: '86%', size: '1.2rem', delay: '0.6s' },
  { glyph: '♪', left: '48%', size: '0.95rem', delay: '2.8s' },
]

export function Details() {
  const { lang, t } = useLang()
  const [spin, setSpin] = useState(false)
  const en = lang === 'en'
  const { venue } = invite
  const venueName = venue.mapLink ? (
    <a href={venue.mapLink} target="_blank" rel="noreferrer" className="underline decoration-gold/60 underline-offset-4">
      {t(venue.name)}
    </a>
  ) : (
    t(venue.name)
  )
  return (
    // The painting stretches to whatever height the details need; its blooms only run down the edges.
    <section className="fade-both relative flex flex-col items-center bg-[length:100%_100%] px-[17%] pt-[16%] pb-[10%] text-center text-leaf" style={{ backgroundImage: `url(${detailsUrl})` }}>
      <h2 data-reveal className={`font-script leading-tight ${en ? 'text-[11cqw]' : 'text-[8cqw] font-bold'}`}>
        {t(invite.details.heading)}
      </h2>
      <Rule className="mt-2 mb-[16cqw] w-[60%] text-[3.5cqw]" />
      <div data-reveal className="relative flex w-full flex-col gap-6 rounded-3xl bg-cream/80 px-4 py-6 shadow-sm shadow-leaf/10">
        {/* Bloom sprays peeking out from behind two corners of the card, and a peacock perched on its top-left
            edge, turned to face the other way from the closing scene's peacock. */}
        <span className="pointer-events-none absolute -top-[7cqw] -right-[9cqw] -z-10 w-[24cqw] -scale-x-100">
          <img src={bloomUrl} alt="" className="sway block w-full origin-bottom-left" />
        </span>
        <span className="pointer-events-none absolute -bottom-[7cqw] -left-[9cqw] -z-10 w-[24cqw] -scale-y-100">
          <img src={bloomUrl} alt="" className="sway block w-full origin-bottom-left" />
        </span>
        <img src={peacockUrl} alt="" className="pointer-events-none absolute -top-[18cqw] -left-[3cqw] w-[15cqw] -scale-x-100" />
        <div>
          <Label text={invite.details.dateTimeLabel} />
          <Line strong>{t(invite.dateLabel)}</Line>
          <Line>{t(invite.time)}</Line>
        </div>
        <div>
          <Label text={invite.details.venueLabel} />
          <Line strong>{venueName}</Line>
          {t(venue.address) && <Line>{t(venue.address)}</Line>}
          {venue.mapLink && (
            <a
              href={venue.mapLink}
              target="_blank"
              rel="noreferrer"
              className={`mt-4 inline-flex items-center gap-2 rounded-full border border-gold/60 bg-cream px-4 py-1.5 text-sm shadow-sm shadow-leaf/10 transition-colors hover:bg-gold/10 ${en ? 'tracking-[0.15em] uppercase' : 'font-medium'}`}
            >
              <svg aria-hidden viewBox="0 0 24 24" className="size-4 fill-none stroke-gold stroke-2">
                <path d="M12 21s-7-6.2-7-12a7 7 0 0 1 14 0c0 5.8-7 12-7 12Z" />
                <circle cx="12" cy="9" r="2.5" />
              </svg>
              {t(invite.details.directions)}
            </a>
          )}
        </div>
      </div>
      {venue.mapEmbedUrl && (
        <iframe
          data-reveal
          title={venue.mapTitle}
          src={venue.mapEmbedUrl}
          loading="lazy"
          referrerPolicy="strict-origin-when-cross-origin"
          allowFullScreen
          className="mt-8 aspect-[4/3] w-full rounded-2xl border-4 border-cream/90 shadow-md shadow-leaf/10"
        />
      )}
      {/* The dancing shoes: a badge swaying to the music, notes drifting up from it, a shimmer passing over it,
          and a spin when tapped. */}
      <div data-reveal className="relative mt-10">
        {NOTES.map((n, i) => (
          <span key={i} aria-hidden className="note-float pointer-events-none absolute bottom-[60%] text-gold" style={{ left: n.left, fontSize: n.size, animationDelay: n.delay }}>
            {n.glyph}
          </span>
        ))}
        <button
          type="button"
          onClick={() => setSpin(true)}
          onAnimationEnd={(e) => e.animationName === 'shoe-spin' && setSpin(false)}
          className={`${spin ? 'shoe-spin' : 'shoe-dance'} shimmer relative inline-block cursor-pointer overflow-hidden rounded-full border border-gold/60 bg-cream/90 px-5 py-2 whitespace-nowrap text-leaf shadow-md shadow-leaf/15 ${en ? 'text-[4.4cqw] italic' : 'text-[4cqw] font-medium'}`}
        >
          {t(invite.details.note)}
        </button>
      </div>
    </section>
  )
}

export function Closing() {
  const { lang, t } = useLang()
  return (
    <footer className="relative text-leaf">
      <img src={closingUrl} alt="" className="fade-top block w-full" />
      {/* In the open sage sky above the chhatri. */}
      <div data-reveal className="absolute inset-x-[12%] top-[13%] isolate flex flex-col items-center text-center">
        {/* Bloom sprays framing the closing words from behind, top-left and bottom-right. */}
        <img src={bloomUrl} alt="" className="sway pointer-events-none absolute -top-[11cqw] -left-[8cqw] -z-10 w-[28cqw] origin-bottom-left" />
        <span className="pointer-events-none absolute -right-[8cqw] -bottom-[11cqw] -z-10 w-[28cqw] -scale-100">
          <img src={bloomUrl} alt="" className="sway block w-full origin-bottom-left" />
        </span>
        <p className={`font-script leading-tight ${lang === 'en' ? 'text-[12cqw]' : 'text-[10cqw] font-bold'}`}>{t(invite.closing)}</p>
        <Rule className="mt-3 w-[45%] text-[3.5cqw]" />
        <p className={`mt-3 max-w-[80%] leading-snug text-balance ${lang === 'en' ? 'text-[4.6cqw] italic' : 'text-[4.2cqw]'}`}>{t(invite.closingNote)}</p>
      </div>
    </footer>
  )
}
