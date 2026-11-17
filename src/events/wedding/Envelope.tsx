import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { DustText } from '../../envelope/DustText'
import { ChuStamp } from '../../envelope/Envelope'
import { GaneshDraw } from '../../envelope/GaneshDraw'
import type { Guest } from '../../envelope/guest'
import { gsap, prefersReducedMotion } from '../../lib/motion'
import { TieVideo } from './TieVideo'
import knotEndUrl from './assets/knot-end.webp'
import loktaUrl from './assets/lokta.webp'
import tieUrl from './assets/tie.mp4'

// The wedding's envelope: one sheet of handmade lokta kagaz tinted soft rose. Ganesh draws himself, the shloka forms
// from gold dust, and a personal link's guest name appears (with a gold चु: for a चुलेनिम्तो). Then the gathbandhan,
// a painted video cut out of its paper (TieVideo): the groom's white daura silk and the bride's Banarasi fly in from
// either side, waving, and are tied into a knot; marigold petals and leaves burst around it. Once it's tied, the
// paper parts down the middle and its halves slide out to either side like a curtain, uncovering the invite; the knot
// rests on it a moment, the petals drifting in slow motion, then lifts away. The paper follows the video's own clock,
// so a stall can't put them out of step; if the video can't play (iPhone low-power mode, say), the tied knot is shown
// and the paper opens anyway.
type Phase = 'writing' | 'invocation' | 'tie'
const READ_MS = 1800 // name and invocation shown before the cloths come in
// Seconds into the video (design/wedding/knot-tie-video.mp4, its first 6 s).
const TIED_S = 2.9 // the knot pulled tight (the petals burst from 3.2 s): the paper starts to part
const PEEL_S = 2.2 // the paper sliding apart
const HOLD_S = 5.0 // the paper's open: the video eases into slow motion, the knot resting while the petals drift
const LIFT_S = 5.75 // then the knot lifts away
const WAIT_MS = 4000 // if the video hasn't started by then, open without it
const SPEED = 1.5 // the video plays this much faster than painted (the times above are in the video's own seconds,
// and the paper follows its clock, so they stay in step)...
const HOLD_SPEED = 0.5 // ...until HOLD_S, when it slows to this over EASE_S
const EASE_S = 0.3

type Props = {
  shloka: readonly string[]
  invocation: string
  openLabel: string // unused here: the envelope opens itself as the knot ties
  onOpen: () => void // the envelope has fully opened
  onOpenStart?: () => void // the envelope has started to open (the invite can begin animating in)
  guest?: Guest | null
}

export default function Envelope({ shloka, invocation, onOpen, onOpenStart, guest }: Props) {
  const root = useRef<HTMLDivElement>(null)
  const left = useRef<HTMLDivElement>(null)
  const right = useRef<HTMLDivElement>(null)
  const content = useRef<HTMLDivElement>(null)
  const knot = useRef<HTMLDivElement>(null)
  const video = useRef<HTMLVideoElement>(null)
  const still = useRef<HTMLImageElement>(null) // the tied knot, if the video can't play
  const [phase, setPhase] = useState<Phase>('writing')

  // Reduced motion: no drawing, dust or tying; the tied knot is shown, then the invite.
  useEffect(() => {
    if (!prefersReducedMotion()) return
    const id = setTimeout(() => {
      onOpenStart?.()
      onOpen()
    }, 2000)
    return () => clearTimeout(id)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (phase === 'invocation') {
      const id = setTimeout(() => setPhase('tie'), READ_MS)
      return () => clearTimeout(id)
    }
    if (phase !== 'tie') return
    const v = video.current
    // Tied (at `tied` s): the sheet hands over to its two halves (identical, so nothing shifts) and they slide apart
    // like a curtain, uncovering the invite behind; then the knot lifts away and the envelope is gone.
    const opening = (tied: number, lift: number) =>
      gsap
        .timeline({ paused: true, onComplete: onOpen })
        .call(() => onOpenStart?.(), [], tied)
        .set([left.current, right.current], { autoAlpha: 1 }, tied)
        .set(root.current, { background: 'none' }, tied)
        .to(content.current, { autoAlpha: 0, duration: 0.4 }, tied)
        .to(left.current, { xPercent: -100, duration: PEEL_S, ease: 'power2.inOut' }, tied)
        .to(right.current, { xPercent: 100, duration: PEEL_S, ease: 'power2.inOut' }, tied)
        .to(knot.current, { y: () => -window.innerHeight * 0.3, autoAlpha: 0, duration: 0.7, ease: 'power2.in' }, lift)
        .set(root.current, { autoAlpha: 0 })
    let tl: gsap.core.Timeline | undefined
    // The video plays and the timeline follows its clock; once it ends, the timeline runs on by itself.
    const follow = () => {
      if (!v || !tl) return
      if (v.ended || v.currentTime >= tl.duration()) {
        gsap.ticker.remove(follow)
        tl.play()
      } else {
        tl.time(v.currentTime)
        const slowing = gsap.utils.clamp(0, 1, (v.currentTime - HOLD_S) / EASE_S)
        v.playbackRate = SPEED + (HOLD_SPEED - SPEED) * slowing
      }
    }
    const playing = () => {
      if (tl) return
      clearTimeout(timer)
      tl = opening(TIED_S, LIFT_S)
      gsap.ticker.add(follow)
    }
    const without = () => {
      if (tl) return
      v?.pause()
      gsap.set(still.current, { autoAlpha: 1 })
      tl = opening(0.8, 0.8 + PEEL_S + 0.6).play()
    }
    const timer = setTimeout(without, WAIT_MS)
    v?.addEventListener('playing', playing)
    if (v) {
      v.defaultPlaybackRate = v.playbackRate = SPEED
      v.play().catch(without)
    }
    else without()
    return () => {
      clearTimeout(timer)
      v?.removeEventListener('playing', playing)
      gsap.ticker.remove(follow)
      tl?.kill()
    }
  }, [phase]) // eslint-disable-line react-hooks/exhaustive-deps

  // Keep --halfw (each half's width) current, so the right half's paper carries on from the left's (.kagaz-right).
  useEffect(() => {
    const el = root.current
    if (!el) return
    const set = () => el.style.setProperty('--halfw', `${left.current?.offsetWidth ?? 0}px`)
    set()
    addEventListener('resize', set)
    return () => removeEventListener('resize', set)
  }, [])

  const reduced = prefersReducedMotion()
  const shown = (on: boolean) => (on || reduced ? 'opacity-100 blur-0' : 'translate-y-2 opacity-0 blur-sm')

  return (
    <div
      ref={root}
      // While closed, the root is the whole sheet; it hands over to the two halves as they start to slide apart.
      className="wedding-envelope kagaz fixed inset-0 z-50 overflow-hidden"
      style={{ '--lokta': `url(${loktaUrl})` } as CSSProperties}
    >
      {/* The sheet's two halves, hidden (the root paints the whole sheet) until the cloths draw them open: shown
          while closed, the browser draws a hairline where they meet. */}
      <div ref={left} className="kagaz kagaz-left invisible absolute inset-y-0 left-0 w-1/2" />
      <div ref={right} className="kagaz kagaz-right invisible absolute inset-y-0 right-0 w-[calc(50%+2px)]" />

      <div ref={content} className="text-kagaz-ink">
        {/* Above the knot: Ganesh draws himself, the shloka forms from gold dust beneath him, then the invocation. */}
        <div className="absolute inset-x-0 top-0 flex h-1/2 flex-col items-center justify-center gap-[min(3vw,1rem,2svh)] px-5 pb-[calc(var(--knot-h)/2+0.5rem)] text-center">
          <GaneshDraw className="w-[min(26vw,7rem,13svh)] drop-shadow-[0_4px_10px_rgb(94_31_34/0.18)]" />
          <DustText
            lines={shloka}
            className="font-display text-[min(4.6vw,1.15rem)] leading-relaxed sm:text-2xl"
            onDone={() => setPhase((p) => (p === 'writing' ? 'invocation' : p))}
          />
          <p className={`font-display text-lg transition-all duration-1000 sm:text-xl ${shown(phase !== 'writing')}`}>{invocation}</p>
        </div>

        {/* Under the knot: a personal link's guest name, and for a चुलेनिम्तो a small gold चु: pressed on beside it. */}
        {guest && (
          <div className="absolute inset-x-0 bottom-0 flex h-1/2 flex-col items-center justify-center px-6 pt-[calc(var(--knot-h)/2+0.5rem)] text-center">
            <p className={`relative font-display text-[min(5.6vw,1.6rem)] leading-snug transition-all duration-1000 ${shown(phase !== 'writing')}`}>
              {guest.name}
              {guest.chu && <ChuStamp pressed={phase !== 'writing' || reduced} className="top-1/2 left-full ml-1 w-[min(14vw,3.75rem)] -translate-y-1/2 text-kagaz-gold" />}
            </p>
          </div>
        )}
      </div>

      {/* The gathbandhan across the middle: the video, cut out (empty until it plays), or the tied knot if it can't
          play or with reduced motion. */}
      <div ref={knot} className="pointer-events-none absolute inset-x-0 top-1/2 h-(--knot-h) -translate-y-1/2">
        {!reduced && <TieVideo src={tieUrl} video={video} className="tie-video" />}
        <img ref={still} src={knotEndUrl} alt="" className={`tie-video ${reduced ? '' : 'invisible'}`} />
      </div>
    </div>
  )
}
