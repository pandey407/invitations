// Makes the mehendi's WhatsApp / Messenger link-preview image (public/previews/mehendi-both.jpg, 1200x630 JPEG):
// the painted garden banner (design/mehendi/mehendi-both.jpeg) with the event's name, in both languages, set in its
// arch, drawn on a canvas with the invite's own fonts (the browser shapes the Devanagari correctly).
//   1. node scripts/mehendi/make-preview.mjs   -> writes preview/index.html (dev-only page, git-ignored)
//   2. python3 scripts/save-preview.py &       -> tiny receiver on :8765 that writes public/previews/*.jpg
//   3. npm run dev, open http://localhost:5173/preview/  (the page draws the image and sends it)
// Re-run after changing the name, occasion or date in src/events/mehendi/content.ts.
import { mkdirSync, writeFileSync } from 'node:fs'
import { join, resolve as resolvePath } from 'node:path'
import { resolve } from '../../src/events/index.ts'

const root = resolvePath(import.meta.dirname, '../..')
const invite = resolve('mehendi', 'both')
const [day, monthYear] = [invite.dateLabel.np.split(',')[0], invite.dateLabel.en.split(', ')[1]]
const T = {
  kicker: invite.kicker.en.toUpperCase(),
  name: invite.headline.map((l) => l.en).join(' '), // Henna Hues
  nameNp: invite.headline.map((l) => l.np).join(' '), // मेहन्दीका रंग
  occasionEn: `${invite.couple.bride.en}${invite.possessive.en} ${invite.occasion.en}`.toUpperCase(),
  occasionNp: `${invite.couple.bride.np}${invite.possessive.np} ${invite.occasion.np}`,
  date: `${day}  ·  ${monthYear.toUpperCase()}`, // मंसिर ७  ·  23 NOVEMBER 2026
}

const html = `<!doctype html><html lang="ne"><head><meta charset="utf-8"><title>preview</title>
<link href="${invite.fonts.replace('display=swap', 'display=block')}" rel="stylesheet">
<style>body{margin:0;background:#222;color:#eee;font:14px system-ui}canvas{display:block}</style></head><body>
<canvas id="c" width="1200" height="630"></canvas><p id="status">drawing…</p>
<script type="module">
const T = ${JSON.stringify(T)}
const ALL = Object.values(T).join(' ')
const load = (src) => new Promise((ok, err) => { const i = new Image(); i.onload = () => ok(i); i.onerror = err; i.src = src })
await Promise.all([
  document.fonts.load("48px 'Great Vibes'", ALL),
  document.fonts.load("700 48px 'Kalam'", ALL),
  document.fonts.load("600 20px 'Noto Serif Devanagari'", ALL),
  document.fonts.load("600 18px 'Cormorant Garamond'", ALL),
])
const bg = await load('/design/mehendi/mehendi-both.jpeg')
const cv = document.getElementById('c'), g = cv.getContext('2d')

// The banner, centre-cropped to 1200x630: its arch's cream window spans about x 386-814 from y 44 down.
const sw = bg.height * 1200 / 630
g.drawImage(bg, (bg.width - sw) / 2, 0, sw, bg.height, 0, 0, 1200, 630)

const LEAF = '#3d5230', GOLD = '#a5823a'
const say = (t, y, font, color, spacing = 0) => { g.font = font; g.fillStyle = color; g.letterSpacing = spacing + 'px'; g.textAlign = 'center'; g.fillText(t, 600, y) }
const rule = (y, w) => {
  g.fillStyle = GOLD + 'b0'; g.fillRect(600 - w, y, w - 12, 1.5); g.fillRect(612, y, w - 12, 1.5)
  g.save(); g.translate(600, y + 0.75); g.rotate(Math.PI / 4); g.fillStyle = GOLD; g.fillRect(-4, -4, 8, 8); g.restore()
}
say(T.kicker, 152, "600 15px 'Cormorant Garamond'", GOLD, 4)
rule(176, 70)
say(T.name, 262, "80px 'Great Vibes'", LEAF)
say(T.nameNp, 356, "700 58px 'Kalam'", LEAF)
rule(392, 110)
say(T.occasionEn, 438, "600 18px 'Cormorant Garamond'", LEAF, 3)
say(T.occasionNp, 474, "600 22px 'Noto Serif Devanagari'", LEAF)
say(T.date, 530, "600 17px 'Cormorant Garamond', 'Noto Serif Devanagari'", GOLD, 2)

// Send the exact pixels to scripts/save-preview.py.
const blob = await new Promise((r) => cv.toBlob(r, 'image/jpeg', 0.88))
const res = await fetch('http://localhost:8765/mehendi-both', { method: 'POST', body: blob }).catch(() => null)
await fetch('http://localhost:8765/done', { method: 'POST', body: '' }).catch(() => null)
document.getElementById('status').textContent = 'mehendi-both ' + (res?.ok ? '✓' : '✗')
</script></body></html>`

mkdirSync(join(root, 'preview'), { recursive: true })
writeFileSync(join(root, 'preview/index.html'), html)
console.log('wrote preview/index.html -> open http://localhost:5173/preview/')
