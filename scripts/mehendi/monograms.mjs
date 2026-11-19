// Nepali monograms for the mehendi (आ & अ, आरुषा & अस्लेष) as SVGs with the lettering converted to outlines, so they
// open in Canva / Illustrator / Inkscape without the fonts installed. HarfBuzz shapes the Devanagari (conjuncts such
// as स्ले and रु, the matras), then each glyph is written out as a path.
//
//   node scripts/mehendi/monograms.mjs   → design/mehendi/print/out/monograms/*.svg (+ preview.html)

import * as hb from 'harfbuzzjs'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const FONTS = join(ROOT, 'design/mehendi/print/fonts')
const OUT = join(ROOT, 'design/mehendi/print/out/monograms')

const C = { rani: '#E0218A', lotus: '#F4A6C8', sage: '#6FA35A', leaf: '#3D5230', gold: '#A5823A', cream: '#F6EEDF' }
const f = (n) => +(+n).toFixed(2)

// ---------- fonts ----------
const fonts = {}
function load(name, file) {
  const data = readFileSync(join(FONTS, file))
  const face = new hb.Face(new hb.Blob(data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength)))
  fonts[name] = { font: new hb.Font(face), upem: face.upem }
}
load('tiro', 'TiroDevanagariHindi-Regular.ttf')
load('tiroItalic', 'TiroDevanagariHindi-Italic.ttf')
load('kalam', 'Kalam-Light.ttf')
load('kalamRegular', 'Kalam-Regular.ttf')
load('vibes', 'GreatVibes-Regular.ttf')

/** Shapes `str` and returns its outline as one path `d` (y down, baseline at 0, origin at the left) plus its bbox. */
function outline(fontName, str, size) {
  const { font, upem } = fonts[fontName]
  const buf = new hb.Buffer()
  buf.addText(str)
  buf.guessSegmentProperties()
  hb.shape(font, buf)
  const infos = buf.getGlyphInfos()
  const pos = buf.getGlyphPositions()
  const k = size / upem
  let pen = 0
  const parts = []
  const box = [Infinity, Infinity, -Infinity, -Infinity]
  infos.forEach((g, i) => {
    const p = pos[i]
    const ox = pen + (p.xOffset ?? p.x_offset ?? 0)
    const oy = p.yOffset ?? p.y_offset ?? 0
    const raw = font.glyphToPath(g.codepoint)
    // Map every coordinate pair: font units, y up → our units, y down.
    const d = raw.replace(/(-?\d*\.?\d+(?:e-?\d+)?)[ ,](-?\d*\.?\d+(?:e-?\d+)?)/g, (_, x, y) => {
      const X = (+x + ox) * k
      const Y = -(+y + oy) * k
      box[0] = Math.min(box[0], X); box[1] = Math.min(box[1], Y); box[2] = Math.max(box[2], X); box[3] = Math.max(box[3], Y)
      return `${f(X)} ${f(Y)}`
    })
    parts.push(d)
    pen += p.xAdvance ?? p.x_advance
  })
  return { d: parts.join(''), advance: pen * k, box }
}

/** Places text so its outline's bbox is centred on (cx, cy). */
function centred(fontName, str, size, cx, cy, attrs) {
  const o = outline(fontName, str, size)
  const dx = cx - (o.box[0] + o.box[2]) / 2
  const dy = cy - (o.box[1] + o.box[3]) / 2
  return { svg: `<path transform="translate(${f(dx)},${f(dy)})" d="${o.d}" ${attrs}/>`, w: o.box[2] - o.box[0], h: o.box[3] - o.box[1] }
}

/** Places text with its baseline at y, horizontally centred on cx (by advance width). */
function onBaseline(fontName, str, size, cx, y, attrs) {
  const o = outline(fontName, str, size)
  return { svg: `<path transform="translate(${f(cx - o.advance / 2)},${f(y)})" d="${o.d}" ${attrs}/>`, w: o.advance, box: o.box }
}

// ---------- drawn ornaments (stroked) ----------
/** An olive/jasmine sprig: a curved stem with almond leaves alternating either side. */
function sprig(x0, y0, x1, y1, bend, leaves, size, color, sw) {
  const mx = (x0 + x1) / 2 + bend * (y1 - y0) * 0.25
  const my = (y0 + y1) / 2 - bend * (x1 - x0) * 0.25
  const at = (t) => [(1 - t) ** 2 * x0 + 2 * (1 - t) * t * mx + t * t * x1, (1 - t) ** 2 * y0 + 2 * (1 - t) * t * my + t * t * y1]
  const tan = (t) => Math.atan2(2 * (1 - t) * (my - y0) + 2 * t * (y1 - my), 2 * (1 - t) * (mx - x0) + 2 * t * (x1 - mx))
  let out = `<path d="M${f(x0)} ${f(y0)} Q${f(mx)} ${f(my)} ${f(x1)} ${f(y1)}" fill="none" stroke="${color}" stroke-width="${sw}" stroke-linecap="round"/>`
  for (let i = 0; i < leaves; i++) {
    const t = 0.12 + (0.8 * i) / (leaves - 1)
    const [px, py] = at(t)
    const side = i % 2 ? 1 : -1
    const ang = (tan(t) * 180) / Math.PI + side * 42
    const L = size * (1 - t * 0.35)
    out += `<path transform="translate(${f(px)},${f(py)}) rotate(${f(ang)})" d="M0 0 C${f(L * 0.3)} ${f(-L * 0.24)} ${f(L * 0.75)} ${f(-L * 0.2)} ${f(L)} 0 C${f(L * 0.75)} ${f(L * 0.2)} ${f(L * 0.3)} ${f(L * 0.24)} 0 0 Z" fill="none" stroke="${color}" stroke-width="${sw}" stroke-linejoin="round"/>`
    out += `<path transform="translate(${f(px)},${f(py)}) rotate(${f(ang)})" d="M${f(L * 0.08)} 0 L${f(L * 0.8)} 0" stroke="${color}" stroke-width="${f(sw * 0.6)}" stroke-linecap="round"/>`
  }
  // a jasmine bud at the tip
  const a = (tan(1) * 180) / Math.PI
  out += `<path transform="translate(${f(x1)},${f(y1)}) rotate(${f(a)})" d="M0 0 C${f(size * 0.2)} ${f(-size * 0.16)} ${f(size * 0.42)} ${f(-size * 0.1)} ${f(size * 0.5)} 0 C${f(size * 0.42)} ${f(size * 0.1)} ${f(size * 0.2)} ${f(size * 0.16)} 0 0 Z" fill="none" stroke="${color}" stroke-width="${sw}"/>`
  return out
}

/** A wavy swash: a sine wave that fades out to the right and ends in a small loop. */
function swash(x0, y0, len, amp, waves, color, sw) {
  const n = 160
  let d = `M${f(x0)} ${f(y0)}`
  for (let i = 1; i <= n; i++) {
    const t = i / n
    const x = x0 + len * t
    const y = y0 + amp * Math.sin(t * waves * 2 * Math.PI) * (1 - t * 0.7) * Math.min(1, t * 4)
    d += ` L${f(x)} ${f(y)}`
  }
  const ex = x0 + len
  const r = amp * 0.9
  d += ` C${f(ex + r * 1.6)} ${f(y0 - r * 0.2)} ${f(ex + r * 1.4)} ${f(y0 - r * 2.2)} ${f(ex + r * 0.4)} ${f(y0 - r * 1.6)} C${f(ex - r * 0.4)} ${f(y0 - r * 1.1)} ${f(ex + r * 0.2)} ${f(y0 + r * 0.4)} ${f(ex + r * 1.8)} ${f(y0 + r * 0.2)}`
  return `<path d="${d}" fill="none" stroke="${color}" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round"/>`
}

/** A wavy ring: r(θ) = R + a·sin(nθ). */
function wavyRing(cx, cy, R, a, n, color, sw) {
  let d = ''
  for (let i = 0; i <= 720; i++) {
    const th = (i / 720) * 2 * Math.PI
    const r = R + a * Math.sin(n * th)
    d += `${i ? 'L' : 'M'}${f(cx + r * Math.cos(th))} ${f(cy + r * Math.sin(th))} `
  }
  return `<path d="${d}Z" fill="none" stroke="${color}" stroke-width="${sw}" stroke-linejoin="round"/>`
}

/** A small outlined lotus. */
function lotus(cx, cy, s, color, sw) {
  const k = s / 20
  const petal = (rot, len, wid) =>
    `<path transform="translate(${f(cx)},${f(cy)}) rotate(${rot}) scale(${f(k)})" d="M0,0 C${-wid},${-len * 0.35} ${-wid * 0.55},${-len * 0.8} 0,${-len} C${wid * 0.55},${-len * 0.8} ${wid},${-len * 0.35} 0,0 Z" fill="none" stroke="${color}" stroke-width="${f(sw / k)}" stroke-linejoin="round"/>`
  return petal(-62, 9, 3.2) + petal(62, 9, 3.2) + petal(-30, 12, 3.6) + petal(30, 12, 3.6) + petal(0, 14, 4)
}

const fill = (c) => `fill="${c}"`
const stroked = (c, w) => `fill="none" stroke="${c}" stroke-width="${w}" stroke-linejoin="round"`

// ---------- the monograms ----------
const MONOGRAMS = {
  // Like the "D&M" cone: initials stacked on a diagonal, a small script &, a fine sprig.
  '1-stacked-initials': {
    w: 1000, h: 1000,
    draw: () => [
      centred('tiro', 'आ', 340, 385, 385, stroked(C.gold, 3)).svg,
      centred('vibes', '&', 190, 560, 560, fill(C.gold)).svg,
      centred('tiro', 'अ', 340, 650, 700, stroked(C.gold, 3)).svg,
      sprig(255, 840, 300, 610, 0.45, 7, 62, C.gold, 2.6),
    ].join(''),
  },

  // Like the "Tanvi & Sahil" cones: a light handwritten signature with a wavy swash underneath.
  '2-signature-names': {
    w: 1500, h: 620,
    draw: () => {
      const a = outline('kalam', 'आरुषा', 210)
      const amp = outline('vibes', '&', 190)
      const b = outline('kalam', 'अस्लेष', 210)
      const gap = 40
      const total = a.advance + gap + amp.advance + gap + b.advance
      let x = (1500 - total) / 2 - 40
      const y = 330
      const parts = []
      parts.push(`<path transform="translate(${f(x)},${f(y)})" d="${a.d}" ${fill(C.leaf)}/>`)
      x += a.advance + gap
      parts.push(`<path transform="translate(${f(x)},${f(y + 20)})" d="${amp.d}" ${fill(C.rani)}/>`)
      x += amp.advance + gap
      parts.push(`<path transform="translate(${f(x)},${f(y + 34)}) rotate(-3)" d="${b.d}" ${fill(C.leaf)}/>`)
      parts.push(swash((1500 - total) / 2 - 10, y + 125, total - 60, 24, 2.5, C.leaf, 3.2))
      return parts.join('')
    },
  },

  // Full names stacked and centred, a script & between thin gold rules, the date beneath.
  '3-stacked-names': {
    w: 1000, h: 1000,
    draw: () => [
      lotus(500, 205, 70, C.gold, 3),
      onBaseline('tiro', 'आरुषा', 200, 500, 410, stroked(C.rani, 2.6)).svg,
      `<path d="M300 500 L430 500 M570 500 L700 500" stroke="${C.gold}" stroke-width="2.4" stroke-linecap="round"/>`,
      centred('vibes', '&', 150, 500, 505, fill(C.gold)).svg,
      onBaseline('tiro', 'अस्लेष', 200, 500, 700, stroked(C.rani, 2.6)).svg,
      onBaseline('tiro', 'मंसिर ७, २०८३', 52, 500, 805, fill(C.gold)).svg,
    ].join(''),
  },

  // A wavy ring with hollow (stroked) initials and the names in handwriting beneath.
  '4-wavy-badge': {
    w: 1000, h: 1000,
    draw: () => [
      wavyRing(500, 500, 410, 13, 22, C.rani, 5),
      `<circle cx="500" cy="500" r="372" fill="none" stroke="${C.gold}" stroke-width="2"/>`,
      centred('tiro', 'आ', 285, 345, 445, stroked(C.rani, 3.4)).svg,
      centred('vibes', '&', 170, 512, 520, fill(C.gold)).svg,
      centred('tiro', 'अ', 285, 668, 445, stroked(C.rani, 3.4)).svg,
      onBaseline('kalam', 'आरुषा  ·  अस्लेष', 78, 500, 700, fill(C.leaf)).svg,
      sprig(400, 780, 600, 770, -0.25, 7, 34, C.gold, 2.4),
    ].join(''),
  },
}

mkdirSync(OUT, { recursive: true })
const tiles = []
for (const [name, m] of Object.entries(MONOGRAMS)) {
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${m.w}" height="${m.h}" viewBox="0 0 ${m.w} ${m.h}">
${m.draw()}
</svg>
`
  writeFileSync(join(OUT, `${name}.svg`), svg)
  tiles.push(`<figure><img src="${name}.svg"><figcaption>${name}</figcaption></figure>`)
  console.log(`wrote out/monograms/${name}.svg`)
}
writeFileSync(
  join(OUT, 'preview.html'),
  `<!doctype html><meta charset="utf-8"><style>body{margin:0;background:${C.cream};display:grid;grid-template-columns:1fr 1fr;gap:16px;padding:16px;font:14px sans-serif}figure{margin:0;background:#fffaf0;padding:8px;border:1px solid #e5dccb}img{width:100%;display:block}</style>${tiles.join('')}`,
)
