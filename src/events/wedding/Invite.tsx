import { useEffect, useRef } from 'react'
import { revealOnScroll, ScrollTrigger, startSmoothScroll } from '../../lib/motion'
import loktaUrl from './assets/lokta.webp'
import { LangToggle } from './components/LangToggle'
import { Petals } from './components/Petals'
import { Closing, Details, Hero, Steps } from './components/Sections'
import { preloadFonts } from './fonts'

// The wedding invite, behind the gathbandhan envelope: one column on soft red lokta kagaz. The shell (src/App.tsx)
// says when the envelope starts opening (`revealing`: start the fade-ups) and when it has opened (`opened`).
export default function Invite({ opened, revealing }: { opened: boolean; revealing: boolean }) {
  const main = useRef<HTMLElement>(null)

  // Fetch every font face (both languages) while the envelope plays, so the language toggle never flashes.
  useEffect(() => {
    preloadFonts()
    const { style } = document.body
    style.background = `url(${loktaUrl}) 0 0 / 640px, #ffded3` // lands on a soft red tint, about #f5d5ca
    style.backgroundBlendMode = 'multiply'
    return () => {
      style.background = style.backgroundBlendMode = ''
    }
  }, [])

  useEffect(() => {
    if (!revealing || !main.current) return
    window.scrollTo(0, 0)
    return revealOnScroll(main.current)
  }, [revealing])

  useEffect(() => {
    if (!opened) return
    ScrollTrigger.refresh() // the page just became scrollable
    return startSmoothScroll()
  }, [opened])

  return (
    <>
      {opened && <Petals />}
      {opened && <LangToggle />}
      <main ref={main} className={`@container mx-auto w-full max-w-[32rem] ${opened ? '' : 'h-svh overflow-hidden'}`}>
        <Hero />
        <Steps />
        <Details />
        <Closing />
      </main>
    </>
  )
}
