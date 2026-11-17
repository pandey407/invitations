// Makes the WhatsApp / Messenger link-preview images for the wedding and reception links
// (public/previews/<event>-<side>.jpg, 1200x630 JPEG), on the painted banner design/wedding/preview.jpeg (the
// gathbandhan across the middle, marigolds at the top corners, banana leaves at the foot), drawn on a canvas so the
// browser shapes the Devanagari.
//   1. node scripts/wedding/make-preview.mjs   -> writes preview/index.html (dev-only page, git-ignored)
//   2. python3 scripts/save-preview.py &       -> tiny receiver on :8765 that writes public/previews/*.jpg
//   3. npm run dev, open http://localhost:5173/preview/  (the page draws every image and sends them)
// Re-run after changing names, occasion or dates in src/events/wedding/content.ts or ../reception/content.ts.
import { mkdirSync, writeFileSync } from 'node:fs'
import { join, resolve as resolvePath } from 'node:path'
import { resolve, routes } from '../../src/events/index.ts'

const root = resolvePath(import.meta.dirname, '../..')
const variants = routes()
  .filter((r) => r.event === 'wedding' || r.event === 'reception')
  .map((r) => {
    const invite = resolve(r.event, r.side)
    const day = r.event === 'reception' ? invite.programme.reception : invite.programme.ceremony
    return {
      name: `${r.event}-${r.side}`,
      T: {
        names: `${invite.partnerOne.np} ${invite.and.np} ${invite.partnerTwo.np}`,
        namesEn: `${invite.partnerOne.en} ${invite.and.en} ${invite.partnerTwo.en}`.toUpperCase(),
        occasion: invite.occasion.np,
        occasionEn: invite.occasion.en.toUpperCase(),
        date: day.date.np,
        dateEn: day.date.en.toUpperCase(),
      },
    }
  })

const html = `<!doctype html><html lang="ne"><head><meta charset="utf-8"><title>preview</title>
<link href="https://fonts.googleapis.com/css2?family=Laila:wght@600&family=Yatra+One&family=Cormorant+Garamond:wght@500;600&family=Noto+Serif+Devanagari:wght@500;600&display=block" rel="stylesheet">
<style>body{margin:0;background:#222;color:#eee;font:14px system-ui}canvas{display:block}</style></head><body>
<canvas id="c" width="1200" height="630"></canvas><p id="status">drawing…</p>
<script type="module">
const VARIANTS = ${JSON.stringify(variants)}
const ALL = VARIANTS.map((v) => Object.values(v.T).join(' ')).join(' ')
const load = (src) => new Promise((ok, err) => { const i = new Image(); i.onload = () => ok(i); i.onerror = err; i.src = src })
await Promise.all([
  document.fonts.load("600 48px 'Laila'", ALL),
  document.fonts.load("40px 'Yatra One'", ALL),
  document.fonts.load("600 30px 'Noto Serif Devanagari'", ALL),
  document.fonts.load("500 14px 'Cormorant Garamond'", 'A'),
])
const bg = await load('/design/wedding/preview.jpeg')
const cv = document.getElementById('c'), g = cv.getContext('2d')
const INK = '#5e1f22', GOLD = '#9a6f24', BODY = "'Cormorant Garamond', 'Noto Serif Devanagari'"
const say = (t, x, y, font, color, spacing = 0) => { g.font = font; g.fillStyle = color; g.letterSpacing = spacing + 'px'; g.textAlign = 'center'; g.fillText(t, x, y) }
const sent = []
for (const { name, T } of VARIANTS) {
  g.reset()
  // The banner, covering the frame (it's a touch taller than 1200x630).
  const s = Math.max(1200 / bg.width, 630 / bg.height), w = bg.width * s, h = bg.height * s
  g.drawImage(bg, (1200 - w) / 2, (630 - h) / 2, w, h)
  // A soft glow of the paper behind the words, so they read over its flecks.
  const glow = (x, y, rx, ry) => {
    g.save(); g.translate(x, y); g.scale(rx, ry)
    const r = g.createRadialGradient(0, 0, 0, 0, 0, 1)
    r.addColorStop(0, 'rgba(250,228,220,.85)'); r.addColorStop(1, 'rgba(250,228,220,0)')
    g.fillStyle = r; g.beginPath(); g.arc(0, 0, 1, 0, Math.PI * 2); g.fill(); g.restore()
  }
  glow(600, 100, 330, 80)
  // Above the knot: the names. Below the cloths, either side of the knot's tails: the occasion and the date.
  say(T.names, 600, 118, '600 58px Laila', INK)
  say(T.namesEn, 600, 152, '600 15px ' + BODY, GOLD, 4)
  glow(400, 470, 150, 70); glow(830, 470, 170, 70)
  say(T.occasion, 400, 478, "44px 'Yatra One'", INK)
  say(T.occasionEn, 400, 510, '600 14px ' + BODY, GOLD, 4)
  say(T.date, 830, 474, "600 28px 'Noto Serif Devanagari'", INK)
  say(T.dateEn, 830, 508, '600 14px ' + BODY, GOLD, 2)
  // Send the exact pixels to scripts/save-preview.py.
  const blob = await new Promise((r) => cv.toBlob(r, 'image/jpeg', 0.88))
  const res = await fetch('http://localhost:8765/' + name, { method: 'POST', body: blob }).catch(() => null)
  sent.push(name + (res?.ok ? ' ✓' : ' ✗'))
}
await fetch('http://localhost:8765/done', { method: 'POST', body: '' }).catch(() => null)
document.getElementById('status').textContent = 'previews: ' + sent.join(', ')
</script></body></html>`

mkdirSync(join(root, 'preview'), { recursive: true })
writeFileSync(join(root, 'preview/index.html'), html)
console.log('wrote preview/index.html -> open http://localhost:5173/preview/')
