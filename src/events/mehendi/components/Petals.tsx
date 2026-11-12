import { useEffect, useRef, useState } from 'react'
import { gsap, prefersReducedMotion } from '../../../lib/motion'

// A shower of blush petals over the page: the painted pieces cut from the petal sheet
// (scripts/mehendi/cut-marigold.py SHEET src/events/mehendi/assets/petals --split). Until that sheet is cut,
// the folder is empty and there is no shower.
const pieces = Object.values(import.meta.glob<string>('../assets/petals/*.webp', { eager: true, import: 'default' }))
const count = () => (window.innerWidth >= 1024 ? 60 : window.innerWidth >= 640 ? 46 : 34)

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
            { x: gsap.utils.random(0, window.innerWidth), y: -60, rotation: gsap.utils.random(0, 360), opacity: 0.95 },
            {
              y: window.innerHeight + 60,
              x: `+=${gsap.utils.random(-140, 140)}`,
              rotation: `+=${gsap.utils.random(160, 520)}`,
              duration: gsap.utils.random(6, 11),
              delay: gsap.utils.random(0, 4),
              ease: 'none',
              onComplete: fall,
            },
          )
        fall()
      })
    }, root)
    return () => ctx.revert()
  }, [])

  if (!pieces.length) return null
  return (
    <div ref={root} aria-hidden className="pointer-events-none fixed inset-0 z-30 overflow-hidden">
      {Array.from({ length: n }, (_, i) => (
        <img key={i} src={pieces[i % pieces.length]} alt="" className={`falling-petal absolute top-0 left-0 -translate-y-20 ${['w-4', 'w-5', 'w-6'][i % 3]}`} />
      ))}
    </div>
  )
}
