import { useEffect, useRef } from 'react'
import { revealOnScroll, startSmoothScroll } from '../../lib/motion'
import plasterUrl from './assets/plaster.webp'
import { LangToggle } from './components/LangToggle'
import { Petals } from './components/Petals'
import { Closing, Details, Hero } from './components/Sections'
import { preloadFonts } from './fonts'

// The bride's mehendi invite. No envelope: it opens straight onto the garden arch.
export default function Invite() {
  const main = useRef<HTMLElement>(null)

  useEffect(() => {
    preloadFonts()
    // Plain sage plaster (from the details painting) behind the page column, so the scenes' plaster edges run
    // on into it on wide screens and in overscroll.
    const { style } = document.body
    style.background = `url(${plasterUrl}) center / cover fixed, #adb595`
    return () => {
      style.background = ''
    }
  }, [])

  useEffect(() => {
    if (!main.current) return
    const stopReveal = revealOnScroll(main.current)
    const stopScroll = startSmoothScroll()
    return () => {
      stopReveal()
      stopScroll()
    }
  }, [])

  return (
    <>
      <Petals />
      <LangToggle />
      {/* The scenes are one column; the plaster behind the page shows through the fades between scenes. */}
      <main ref={main} className="fade-sides @container mx-auto w-full max-w-[32rem]">
        <Hero />
        <Details />
        <Closing />
      </main>
    </>
  )
}
