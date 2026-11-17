import { useEffect, useRef, type RefObject } from 'react'

// The gathbandhan video, cut out of its paper: assets/tie.mp4 (scripts/wedding/key-tie-video.py) holds the picture in
// its top half and a matte below (white = keep), so it's one ordinary H.264 file that plays on every phone. Each frame
// is combined into a transparent picture on a canvas. (The video element itself is kept in the page, invisible:
// hidden with display: none, Safari stops decoding it.) The page plays the <video> (through `video`); the canvas keeps
// the last frame once it ends.
type Props = {
  src: string
  video: RefObject<HTMLVideoElement | null>
  className?: string
}

export function TieVideo({ src, video, className = '' }: Props) {
  const canvas = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const v = video.current
    const cv = canvas.current
    if (!v || !cv) return
    const out = cv.getContext('2d')!
    const work = document.createElement('canvas')
    const g = work.getContext('2d', { willReadFrequently: true })!
    let stop = false

    let drawn = -1
    const draw = () => {
      if (!v.videoWidth || v.currentTime === drawn || (v.paused && v.currentTime === 0)) return // nothing until it plays
      drawn = v.currentTime
      // Work at the size it's shown (no bigger than the video), so the per-pixel pass stays light on phones.
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      const w = Math.max(1, Math.min(v.videoWidth, Math.round(cv.clientWidth * dpr)))
      const h = Math.round((w * v.videoHeight) / 2 / v.videoWidth)
      if (cv.width !== w || cv.height !== h) {
        cv.width = work.width = w
        cv.height = h
        work.height = h * 2
      }
      g.drawImage(v, 0, 0, w, h * 2)
      const both = g.getImageData(0, 0, w, h * 2).data
      const pic = out.createImageData(w, h)
      const px = pic.data
      const off = w * h * 4
      for (let i = 0; i < off; i += 4) {
        const a = both[off + i] // the matte's red
        px[i] = both[i]
        px[i + 1] = both[i + 1]
        px[i + 2] = both[i + 2]
        px[i + 3] = a < 10 ? 0 : a > 245 ? 255 : a
      }
      out.putImageData(pic, 0, 0)
    }

    // Checked every animation frame, drawn when the video has moved on. (Not requestVideoFrameCallback: browsers
    // skip it for a video that isn't itself on screen.)
    const tick = () => {
      if (stop) return
      draw()
      requestAnimationFrame(tick)
    }
    tick()
    return () => {
      stop = true
    }
  }, [video])

  return (
    <>
      <video ref={video} src={src} muted playsInline preload="auto" aria-hidden className="pointer-events-none absolute size-px opacity-0" />
      <canvas ref={canvas} aria-hidden className={className} />
    </>
  )
}
