import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { DustText } from '../../envelope/DustText'
import { ChuStamp } from '../../envelope/Envelope'
import { GaneshDraw } from '../../envelope/GaneshDraw'
import type { Guest } from '../../envelope/guest'
import { gsap, prefersReducedMotion } from '../../lib/motion'
import { TieVideo } from './TieVideo'
import { invite } from './invite'
import knotEndUrl from './assets/knot-end.webp'
import loktaUrl from './assets/lokta.webp'
import tieUrl from './assets/tie.mp4'

// The wedding's envelope: one sheet of handmade lokta kagaz tinted soft rose. Ganesh draws himself, the shloka forms
// from gold dust, and निमन्त्रणा and a personal link's guest name appear (with a gold चु: for a चुलेनिम्तो) and hold
// a moment (or until a tap). Then the gathbandhan, a painted video cut out of its paper (TieVideo): the groom's white
// daura silk and the bride's Banarasi fly in from either side, waving, and are tied into a knot; marigold petals and
// leaves burst around it. As they burst, a soft round hole opens in the paper from the knot, its edge riding on the
// petals' outer edge as they spread (kept on the video's clock, so a stall can't put them out of step), then on out
// until the invite behind is uncovered; the knot fades out where it is while the clip is still playing (it never stops
// on a frame). If the video can't play
// (iPhone low-power mode, say), the tied knot is shown and the paper opens anyway.
type Phase = 'writing' | 'invocation' | 'tie'
// Seconds into the video (design/wedding/knot-tie-video.mp4, its first 6 s).
// The hole in the paper rides on the petal burst's outer edge. Measured from the cut-out frames (as a fraction of the
// video's width): nothing until 3.3 s into the clip, a quick pop to 0.19 as it bursts (by 3.65 s), then a steady,
// slowly quickening spread to 0.43 at the end (6 s); smoothed into the two eased stretches below.
const OPEN_S = 3.3 // the burst starts behind the knot: the paper starts to open
const BURST_S = 3.65 // the burst has popped out...
const BURST_R = 0.19 // ...this far
const CLIP_S = 6 // the clip's length (scripts/wedding/key-tie-video.py --end)
const END_R = 0.43 // where the petals' edge is when it ends
const AFTER_S = 1.1 // then the hole carries on out past the corners (clip seconds, like everything here)
const SPEED = 1.5 // the video plays this much faster than painted; the timeline runs at the same rate
const EDGE = 56 // px: the hole's soft edge (.kagaz-reveal), centred on the petals' outer edge
const FADE_S = 5.35 // the knot fades out where it is, still moving, gone just before the clip's last frame...
const FADE_DUR = 0.6 // ...over this long
const WAIT_MS = 4000 // if the video hasn't started by then, open without it

const READ_MS = 2800 // from the invocation appearing: the name fades in (~1.3 s), then holds before the cloths come

type Props = {
  shloka: readonly string[]
  invocation: string
  openLabel: string // read out by screen readers for the tap-to-open-now button
  onOpen: () => void // the envelope has fully opened
  onOpenStart?: () => void // the envelope has started to open (the invite can begin animating in)
  guest?: Guest | null
}

export default function Envelope({ shloka, invocation, openLabel, onOpen, onOpenStart, guest }: Props) {
  const root = useRef<HTMLDivElement>(null)
  const sheet = useRef<HTMLDivElement>(null) // the paper, once a hole opens in it
  const content = useRef<HTMLDivElement>(null)
  const knot = useRef<HTMLDivElement>(null)
  const video = useRef<HTMLVideoElement>(null)
  const still = useRef<HTMLImageElement>(null) // the tied knot, if the video can't play
  const [phase, setPhase] = useState<Phase>('writing')

  // The guest reads their name (it fades in, then holds), and the envelope opens by itself: the gathbandhan ties and
  // the paper parts. A tap opens it straight away. (With reduced motion there's no video, so the tied knot is shown
  // and the paper opens.)
  useEffect(() => {
    if (phase === 'invocation') {
      const id = setTimeout(() => setPhase('tie'), READ_MS)
      return () => clearTimeout(id)
    }
    if (phase !== 'tie') return
    const v = video.current
    const width = () => knot.current?.querySelector('canvas')?.clientWidth || window.innerWidth
    const hole = (r: number) => () => `${Math.max(0, r * width() - EDGE / 2)}px` // r: fraction of the video's width
    const full = () => `${Math.hypot(window.innerWidth, window.innerHeight) / 2 + EDGE}px` // past every corner
    const finish = () => {
      gsap.set(root.current, { autoAlpha: 0 })
      onOpen()
    }
    // Opening (at `at`): the paper hands over to its own layer (identical, so nothing shifts), in which a soft round
    // hole opens from the knot, and the words fade.
    const opening = (tl: gsap.core.Timeline, at: number) =>
      tl
        .call(() => onOpenStart?.(), [], at)
        .set(sheet.current, { autoAlpha: 1, '--hole': '0px' }, at)
        .set(root.current, { background: 'none' }, at)
        .to(content.current, { autoAlpha: 0, duration: 0.4 }, at)
    let tl: gsap.core.Timeline | undefined
    // With the video: one timeline in the clip's own seconds, run at the video's speed so everything moves smoothly,
    // and nudged back onto the video's clock if they drift (a stall, a slow phone). The hole pops out with the burst,
    // spreads with the petals, then carries on (at the speed it had) out to the corners as the knot fades.
    const sync = () => {
      if (!v || !tl || v.ended || v.paused) return
      if (Math.abs(tl.time() - v.currentTime) > 0.12) tl.time(v.currentTime)
    }
    const playing = () => {
      clearTimeout(timer)
      if (tl) return void tl.resume()
      tl = opening(gsap.timeline({ onComplete: finish }), OPEN_S)
        .fromTo(sheet.current, { '--hole': '0px' }, { '--hole': hole(BURST_R), duration: BURST_S - OPEN_S, ease: 'power2.out', immediateRender: false }, OPEN_S)
        .to(sheet.current, { '--hole': hole(END_R), duration: CLIP_S - BURST_S, ease: 'power1.in' }, BURST_S)
        .to(sheet.current, { '--hole': full, duration: AFTER_S, ease: 'power1.out' }, CLIP_S)
        .to(knot.current, { autoAlpha: 0, duration: FADE_DUR, ease: 'power1.inOut' }, FADE_S)
        .timeScale(SPEED)
        .time(v?.currentTime ?? 0)
      gsap.ticker.add(sync)
    }
    const waiting = () => tl?.pause()
    // Without the video: the tied knot, then the hole opening steadily and the knot fading.
    const without = () => {
      if (tl) return
      v?.pause()
      gsap.set(still.current, { autoAlpha: 1 })
      tl = opening(gsap.timeline({ onComplete: finish }), 0.8)
        .to(sheet.current, { '--hole': full, duration: 2.2, ease: 'power1.inOut' }, 0.8)
        .to(knot.current, { autoAlpha: 0, duration: 0.6 }, 1.4)
    }
    const timer = setTimeout(without, WAIT_MS)
    v?.addEventListener('playing', playing)
    v?.addEventListener('waiting', waiting)
    if (v) {
      v.defaultPlaybackRate = v.playbackRate = SPEED
      v.play().catch(without)
    }
    else without()
    return () => {
      clearTimeout(timer)
      v?.removeEventListener('playing', playing)
      v?.removeEventListener('waiting', waiting)
      gsap.ticker.remove(sync)
      tl?.kill()
    }
  }, [phase]) // eslint-disable-line react-hooks/exhaustive-deps

  const reduced = prefersReducedMotion()
  const shown = (on: boolean) => (on || reduced ? 'opacity-100 blur-0' : 'translate-y-2 opacity-0 blur-sm')

  return (
    <div
      ref={root}
      // While closed, the root is the whole sheet; it hands over to the sheet layer as the hole opens.
      className="wedding-envelope kagaz fixed inset-0 z-50 overflow-hidden"
      style={{ '--lokta': `url(${loktaUrl})` } as CSSProperties}
    >
      {/* The paper again, on its own layer (hidden until it opens) so the hole opening in it leaves the knot whole. */}
      <div ref={sheet} className="kagaz kagaz-reveal invisible absolute inset-0" />

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

        {/* Under the knot: निमन्त्रणा in a flowing hand, then a personal link's guest name, and for a चुलेनिम्तो a
            small gold चु: pressed on beside it. */}
        <div className="absolute inset-x-0 bottom-0 flex h-1/2 flex-col items-center justify-center gap-[min(2vw,0.75rem)] px-6 pt-[calc(var(--knot-h)/2+0.5rem)] text-center">
          <p className={`font-nimantrana text-[min(13vw,3.75rem)] leading-tight text-kagaz-gold transition-all duration-1000 ${shown(phase !== 'writing')}`}>{invite.nimantrana}</p>
          {guest && (
            <p className={`relative ${guest.chu ? 'max-w-[calc(100%-2*min(23vw,6.5rem))]' : ''} font-display text-[min(7.4vw,2.25rem)] leading-snug text-balance transition-all delay-300 duration-1000 ${shown(phase !== 'writing')}`}>
              {guest.name}
              {guest.chu && <ChuStamp ring pressed={phase !== 'writing' || reduced} className="top-1/2 left-full ml-[min(5vw,1.5rem)] w-[min(17vw,4.75rem)] -translate-y-1/2 text-kagaz-gold" />}
            </p>
          )}
        </div>
      </div>

      {/* Once the blessing is up, a tap anywhere opens it without waiting. */}
      {phase === 'invocation' && (
        <button type="button" aria-label={openLabel} onClick={() => setPhase('tie')} className="absolute inset-0 z-10 cursor-pointer" />
      )}

      {/* The gathbandhan across the middle: the video, cut out (empty until it plays), or the tied knot if it can't
          play or with reduced motion. */}
      <div ref={knot} className="pointer-events-none absolute inset-x-0 top-1/2 h-(--knot-h) -translate-y-1/2">
        {!reduced && <TieVideo src={tieUrl} video={video} className="tie-video" />}
        <img ref={still} src={knotEndUrl} alt="" className={`tie-video ${reduced ? '' : 'invisible'}`} />
      </div>
    </div>
  )
}
