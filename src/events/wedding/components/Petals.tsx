import { useEffect, useRef, useState } from 'react'
import { gsap, prefersReducedMotion } from '../../../lib/motion'

// Marigold and rose petals, leaves and jasmine (cut from design/wedding/petals.jpeg) drifting down over the page.
const pieces = Object.values(import.meta.glob<string>('../assets/petals/*.webp', { eager: true, import: 'default' }))
const count = () => (window.innerWidth >= 1024 ? 40 : window.innerWidth >= 640 ? 30 : 20)

export function Petals() {
  const root = useRef<HTMLDivElement>(null)
  const [n] = useState(count)

  useEffect(() => {
    if (prefersReducedMotion() || !root.current) return
    const ctx = gsap.context(() => {
      gsap.utils.toArray<HTMLElement>('.falling-petal').forEach((el) => {
        const fall = () =>
          gsap.fromTo(
            el,
            { x: gsap.utils.random(0, window.innerWidth), y: -60, rotation: gsap.utils.random(0, 360), opacity: 0.9 },
            {
              y: window.innerHeight + 60,
              x: `+=${gsap.utils.random(-120, 120)}`,
              rotation: `+=${gsap.utils.random(160, 480)}`,
              duration: gsap.utils.random(7, 12),
              delay: gsap.utils.random(0, 5),
              ease: 'none',
              onComplete: fall,
            },
          )
        fall()
      })
    }, root)
    return () => ctx.revert()
  }, [])

  return (
    <div ref={root} aria-hidden className="pointer-events-none fixed inset-0 z-30 overflow-hidden">
      {Array.from({ length: n }, (_, i) => (
        <img key={i} src={pieces[(i * 7) % pieces.length]} alt="" className={`falling-petal absolute top-0 left-0 max-w-none -translate-y-20 ${['w-4', 'w-5', 'w-6'][i % 3]}`} />
      ))}
    </div>
  )
}
