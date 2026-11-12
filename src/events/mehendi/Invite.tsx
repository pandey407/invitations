import { useEffect, useRef, useState } from 'react'
import { revealOnScroll, startSmoothScroll } from '../../lib/motion'
import heroUrl from './assets/hero.webp'
import plasterUrl from './assets/plaster.webp'
import { LangToggle } from './components/LangToggle'
import { Petals } from './components/Petals'
import { Closing, Details, Hero } from './components/Sections'
import { preloadFonts } from './fonts'

// The bride's mehendi invite. No envelope: it opens straight onto the garden arch.
export default function Invite() {
  const main = useRef<HTMLElement>(null)
  // The words sit at set spots in the paintings, so the page waits (hidden) for its fonts and the opening
  // painting, then fades in whole: no fallback font jumping into place. Capped, so a slow connection still
  // shows the invite.
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const art = new Image()
    art.src = heroUrl
    const cap = new Promise((ok) => setTimeout(ok, 3000))
    Promise.race([Promise.all([preloadFonts(), art.decode().catch(() => {})]), cap]).then(() => setReady(true))
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
      <main ref={main} className={`fade-sides @container mx-auto w-full max-w-[32rem] transition-opacity duration-700 ${ready ? 'opacity-100' : 'opacity-0'}`}>
        <Hero />
        <Details />
        <Closing />
      </main>
    </>
  )
}
