// Print files for the mehendi props: vector layouts (arch, hairlines, lotuses, real text) with a slot for the
// Gemini illustration, exported as print PDFs (3 mm bleed + crop marks) and standalone SVGs (trim + bleed).
//
//   node scripts/mehendi/build-print.mjs            # builds every piece
//   node scripts/mehendi/build-print.mjs bangle-card
//
// Illustrations go in design/mehendi/print/art/<piece>.png (or .jpg). Until one is there, the piece prints a dashed
// placeholder. Illustrations are drawn with multiply blending, so a Gemini cream/white background melts into the paper.

import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const DIR = join(ROOT, 'design/mehendi/print')
const OUT = join(DIR, 'out')
const BROWSER = '/Applications/Brave Browser.app/Contents/MacOS/Brave Browser'

const C = {
  cream: '#F6EEDF',
  paper: '#F1E6D2',
  rani: '#E0218A',
  lotus: '#F4A6C8',
  sage: '#6FA35A',
  leaf: '#3D5230',
  gold: '#A5823A',
  marigold: '#F2A900',
}
const BLEED = 3 // mm
const SLUG = 10 // mm of margin outside the bleed for the crop marks

// ---------- fonts (embedded so the SVGs and PDFs carry them) ----------
const font = (file) => readFileSync(join(DIR, 'fonts', file)).toString('base64')
const FONT_CSS = `
@font-face{font-family:'Great Vibes';src:url(data:font/ttf;base64,${font('GreatVibes-Regular.ttf')})}
@font-face{font-family:'Cormorant Garamond';font-weight:300 700;src:url(data:font/ttf;base64,${font('CormorantGaramond.ttf')})}
@font-face{font-family:'Cormorant Garamond';font-style:italic;font-weight:300 700;src:url(data:font/ttf;base64,${font('CormorantGaramond-Italic.ttf')})}
.script{font-family:'Great Vibes',cursive}
.serif{font-family:'Cormorant Garamond',serif}
`

// ---------- geometry helpers ----------
const f = (n) => +n.toFixed(3)
const cubic = (p0, p1, p2, p3, t) => {
  const u = 1 - t
  return [0, 1].map((i) => u * u * u * p0[i] + 3 * u * u * t * p1[i] + 3 * u * t * t * p2[i] + t * t * t * p3[i])
}
/** n+1 points spaced evenly along a cubic */
function resample(p0, p1, p2, p3, n) {
  const pts = Array.from({ length: 401 }, (_, i) => cubic(p0, p1, p2, p3, i / 400))
  const len = [0]
  for (let i = 1; i < pts.length; i++) len.push(len[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]))
  const out = []
  for (let k = 0, j = 0; k <= n; k++) {
    const target = (len.at(-1) * k) / n
    while (j < len.length - 1 && len[j + 1] < target) j++
    out.push(pts[j])
  }
  out[n] = p3
  return out
}

/**
 * A Mughal arch: straight sides from `bottom` up to `spring`, then a pointed top meeting at `apex`.
 * `cusps` > 0 makes the top scalloped (cusped), each scallop bulging inward like the invitation's arch.
 */
function arch({ x0, x1, bottom, spring, apex, cusps = 0, closed = true }) {
  const cx = (x0 + x1) / 2
  const w = x1 - x0
  const L = [[x0, spring], [x0, spring - (spring - apex) * 0.55], [cx - w * 0.12, apex + (spring - apex) * 0.22], [cx, apex]]
  const R = [[cx, apex], [cx + w * 0.12, apex + (spring - apex) * 0.22], [x1, spring - (spring - apex) * 0.55], [x1, spring]]
  let d = `M${f(x0)},${f(bottom)} L${f(x0)},${f(spring)}`
  if (!cusps) {
    d += ` C${L.slice(1).flat().map(f)} C${R.slice(1).flat().map(f)}`
  } else {
    for (const side of [L, R]) {
      const pts = resample(...side, cusps)
      for (let i = 1; i < pts.length; i++) {
        const [ax, ay] = pts[i - 1]
        const [bx, by] = pts[i]
        const r = Math.hypot(bx - ax, by - ay) * 0.56
        d += ` A${f(r)},${f(r)} 0 0 0 ${f(bx)},${f(by)}`
      }
    }
  }
  d += ` L${f(x1)},${f(bottom)}`
  if (closed) d += ' Z'
  return d
}

/** A small open lotus: five petals and a base, in fine line with a soft fill. `s` is the flower's width in mm. */
function lotus(x, y, s, { fill = C.lotus, stroke = C.rani, line = 0.25, opacity = 1 } = {}) {
  const k = s / 20
  const petal = (rot, len, wid) =>
    `<path transform="rotate(${rot})" d="M0,0 C${-wid},${-len * 0.35} ${-wid * 0.55},${-len * 0.8} 0,${-len} C${wid * 0.55},${-len * 0.8} ${wid},${-len * 0.35} 0,0 Z"/>`
  return `<g transform="translate(${f(x)},${f(y)}) scale(${f(k)})" fill="${fill}" stroke="${stroke}" stroke-width="${f(line / k)}" stroke-linejoin="round" opacity="${opacity}">
    ${petal(-62, 9, 3.2)}${petal(62, 9, 3.2)}${petal(-30, 12, 3.6)}${petal(30, 12, 3.6)}${petal(0, 14, 4)}
    <path d="M-7,0.6 C-4,3 4,3 7,0.6" fill="none"/>
  </g>`
}

/** A closed lotus bud on a curved stem with one leaf. */
function bud(x, y, s, lean = 1, { fill = C.lotus, stroke = C.rani, stemColor = C.sage, line = 0.25 } = {}) {
  const k = s / 20
  return `<g transform="translate(${f(x)},${f(y)}) scale(${f(k * lean)},${f(k)})" stroke-linejoin="round" stroke-linecap="round">
    <path d="M0,0 C1,8 -1,16 2,26" fill="none" stroke="${stemColor}" stroke-width="${f((line * 1.4) / k)}"/>
    <path d="M1,14 C6,10 11,11 13,15 C9,17 4,17 1,14 Z" fill="${stemColor}" fill-opacity="0.45" stroke="${stemColor}" stroke-width="${f(line / k)}"/>
    <path d="M0,0 C-4.5,-3 -4.5,-10 0,-15 C4.5,-10 4.5,-3 0,0 Z" fill="${fill}" stroke="${stroke}" stroke-width="${f(line / k)}"/>
    <path d="M0,0 C-2,-4 -1.5,-9 0,-15" fill="none" stroke="${stroke}" stroke-width="${f((line * 0.8) / k)}"/>
  </g>`
}

/** Fitted text: the browser shrinks it to `maxw` mm if it runs wider (see FIT_SCRIPT). */
function text(x, y, str, { cls = 'serif', size, fill = C.leaf, weight = 400, italic = false, track = 0, maxw, anchor = 'middle' }) {
  const style = `font-size:${size}px;font-weight:${weight};${italic ? 'font-style:italic;' : ''}letter-spacing:${track}px`
  return `<text x="${f(x)}" y="${f(y)}" class="${cls}" text-anchor="${anchor}" fill="${fill}" style="${style}"${maxw ? ` data-maxw="${maxw}"` : ''}>${str}</text>`
}

/** The A & A monogram: a thin gold ring with the letters, a tiny lotus beneath. */
function monogram(x, y, s) {
  const amp = `<tspan class="script" style="font-size:${f(s * 0.36)}px"> &amp; </tspan>`
  return `<g>
    <circle cx="${f(x)}" cy="${f(y)}" r="${f(s / 2)}" fill="none" stroke="${C.gold}" stroke-width="${f(s * 0.012)}"/>
    <circle cx="${f(x)}" cy="${f(y)}" r="${f(s / 2 - s * 0.05)}" fill="none" stroke="${C.gold}" stroke-width="${f(s * 0.005)}"/>
    ${text(x, y + s * 0.11, `A${amp}A`, { size: f(s * 0.3), fill: C.gold, weight: 500 })}
  </g>`
}

/** The illustration slot: the Gemini art if it exists, else a dashed placeholder with a label. */
function slot(piece, x, y, w, h, label) {
  for (const ext of ['png', 'jpg', 'jpeg', 'webp']) {
    const file = join(DIR, 'art', `${piece}.${ext}`)
    if (existsSync(file)) {
      const data = readFileSync(file).toString('base64')
      const mime = ext === 'jpg' ? 'jpeg' : ext
      return `<image href="data:image/${mime};base64,${data}" x="${f(x)}" y="${f(y)}" width="${f(w)}" height="${f(h)}" preserveAspectRatio="xMidYMid meet" style="mix-blend-mode:multiply"/>`
    }
  }
  return `<g>
    <rect x="${f(x)}" y="${f(y)}" width="${f(w)}" height="${f(h)}" rx="${f(Math.min(w, h) * 0.04)}" fill="none" stroke="${C.gold}" stroke-opacity="0.55" stroke-width="${f(Math.min(w, h) * 0.003)}" stroke-dasharray="${f(w * 0.015)} ${f(w * 0.012)}"/>
    ${text(x + w / 2, y + h / 2, label, { size: f(w * 0.035), fill: C.gold, italic: true })}
    ${text(x + w / 2, y + h / 2 + w * 0.05, `art/${piece}.png`, { size: f(w * 0.025), fill: C.gold, track: f(w * 0.002) })}
  </g>`
}

// ---------- the pieces (all coordinates in mm on the trim, origin top-left) ----------
const PIECES = {
  'bole-chudiyan-sign': {
    title: 'Bole Chudiyan — bangle bar sign (A2)',
    w: 420,
    h: 594,
    draw: ({ w, h }) => {
      const cx = w / 2
      const a = { x0: 52, x1: w - 52, bottom: h - 44, spring: 172, apex: 58 }
      return `
        <path d="${arch(a)}" fill="${C.cream}" stroke="${C.gold}" stroke-width="1.1"/>
        <path d="${arch({ x0: a.x0 + 7, x1: a.x1 - 7, bottom: a.bottom - 7, spring: a.spring + 4, apex: a.apex + 12, cusps: 7 })}" fill="none" stroke="${C.gold}" stroke-width="0.45"/>
        ${lotus(cx, a.apex - 7, 13, { opacity: 1 })}

        ${text(cx, 232, 'Bole Chudiyan', { cls: 'script', size: 66, fill: C.rani, maxw: 262 })}
        ${text(cx, 256, 'THE BANGLE BAR', { size: 12, fill: C.leaf, weight: 600, track: 5.5 })}
        <path d="M${cx - 34},265 L${cx - 6},265 M${cx + 6},265 L${cx + 34},265" stroke="${C.gold}" stroke-width="0.45"/>
        <circle cx="${cx}" cy="265" r="1.3" fill="${C.gold}"/>
        ${lotus(cx, 150, 20)}

        ${slot('bole-chudiyan-sign', 78, 276, w - 156, 190, 'Gemini illustration: two hennaed hands with bangles')}

        ${text(cx, 488, 'Pick your colours, stack them high', { size: 17, fill: C.leaf, italic: true, weight: 500 })}
        ${monogram(cx, 510, 20)}
        ${text(cx, 534, 'AARUSHA &amp; ASHLESH  ·  HENNA HUES  ·  23.11.2026', { size: 7, fill: C.gold, weight: 600, track: 2.2, maxw: 222 })}

        ${bud(a.x0 + 22, a.bottom - 40, 22, 1)}
        ${bud(a.x0 + 34, a.bottom - 30, 15, -1)}
        ${bud(a.x1 - 22, a.bottom - 40, 22, -1)}
        ${bud(a.x1 - 34, a.bottom - 30, 15, 1)}
      `
    },
  },

  'bangle-card': {
    title: 'Bangle favour card (4 × 6 in)',
    w: 101.6,
    h: 152.4,
    draw: ({ w, h }) => {
      const cx = w / 2
      return `
        <rect x="5" y="5" width="${f(w - 10)}" height="${f(h - 10)}" fill="none" stroke="${C.gold}" stroke-width="0.3"/>
        ${monogram(cx, 20, 12.5)}
        ${lotus(cx, 31.5, 5.5)}
        ${slot('bangle-card', 12, 35, w - 24, 72, 'Gemini art: hennaed hands')}
        ${text(cx, 121, 'Aarusha &amp; Ashlesh', { cls: 'script', size: 15.5, fill: C.leaf, maxw: 78 })}
        ${text(cx, 130.5, 'HENNA HUES  ·  23.11.2026', { size: 3.4, fill: C.gold, weight: 600, track: 1.1 })}
        ${bud(w - 13, h - 18.5, 6.2, -1)}
        ${bud(w - 17.5, h - 16, 4.4, 1)}
      `
    },
  },
}

// ---------- page assembly ----------
const FIT_SCRIPT = `
document.fonts.ready.then(() => {
  for (const t of document.querySelectorAll('text[data-maxw]')) {
    const max = +t.dataset.maxw, len = t.getComputedTextLength()
    if (len > max) t.style.fontSize = (parseFloat(t.style.fontSize) * max / len).toFixed(3) + 'px'
  }
  document.body.dataset.ready = '1'
})`

function artSvg(piece, at) {
  const { w, h, draw } = PIECES[piece]
  const W = w + 2 * BLEED
  const H = h + 2 * BLEED
  // Units are mm: 1 user unit = 1 mm, so font sizes in "px" are mm too.
  // Standalone it is sized in mm; placed on the print page (whose units are already mm) it is sized in user units.
  const size = at ? `x="${at}" y="${at}" width="${f(W)}" height="${f(H)}"` : `width="${f(W)}mm" height="${f(H)}mm"`
  return `<svg id="art" xmlns="http://www.w3.org/2000/svg" ${size} viewBox="${f(-BLEED)} ${f(-BLEED)} ${f(W)} ${f(H)}">
  <style>${FONT_CSS}</style>
  <rect x="${-BLEED}" y="${-BLEED}" width="${f(W)}" height="${f(H)}" fill="${C.paper}"/>
  ${draw({ w, h })}
</svg><!--art-end-->`
}

function cropMarks(w, h) {
  const o = SLUG + BLEED
  const len = SLUG - 2
  const line = (x1, y1, x2, y2) => `<line x1="${f(x1)}" y1="${f(y1)}" x2="${f(x2)}" y2="${f(y2)}"/>`
  const marks = []
  for (const x of [o, o + w]) for (const y of [o, o + h]) {
    const sx = x === o ? -1 : 1
    const sy = y === o ? -1 : 1
    marks.push(line(x + sx * (BLEED + 1), y, x + sx * (BLEED + 1 + len), y)) // horizontal mark beside the corner
    marks.push(line(x, y + sy * (BLEED + 1), x, y + sy * (BLEED + 1 + len))) // vertical mark
  }
  return `<g stroke="#000" stroke-width="0.25">${marks.join('')}</g>`
}

function pageHtml(piece) {
  const { w, h, title } = PIECES[piece]
  const PW = w + 2 * (BLEED + SLUG)
  const PH = h + 2 * (BLEED + SLUG)
  return `<!doctype html><html><head><meta charset="utf-8"><title>${title}</title>
<style>@page{size:${f(PW)}mm ${f(PH)}mm;margin:0}html,body{margin:0;background:#fff}svg{display:block}</style></head>
<body><svg xmlns="http://www.w3.org/2000/svg" width="${f(PW)}mm" height="${f(PH)}mm" viewBox="0 0 ${f(PW)} ${f(PH)}">
${cropMarks(w, h)}
<text x="${SLUG + BLEED}" y="${f(SLUG * 0.55)}" style="font:2.4px sans-serif" fill="#000">${title} · trim ${w} × ${h} mm · bleed ${BLEED} mm</text>
${artSvg(piece, SLUG)}
</svg><script>${FIT_SCRIPT}</script></body></html>`
}

function run(args) {
  return execFileSync(BROWSER, ['--headless=new', '--disable-gpu', '--no-pdf-header-footer', '--hide-scrollbars', '--virtual-time-budget=8000', ...args], {
    maxBuffer: 1 << 28,
    stdio: ['ignore', 'pipe', 'ignore'],
  }).toString()
}

mkdirSync(OUT, { recursive: true })
const wanted = process.argv.slice(2)
for (const piece of wanted.length ? wanted : Object.keys(PIECES)) {
  if (!PIECES[piece]) throw new Error(`unknown piece ${piece}; have ${Object.keys(PIECES).join(', ')}`)
  const html = join(OUT, `${piece}.html`)
  writeFileSync(html, pageHtml(piece))
  run([`--print-to-pdf=${join(OUT, `${piece}.pdf`)}`, `file://${html}`])
  // The standalone SVG is the artwork after the browser fitted the text, trim + bleed, fonts embedded.
  const dom = run(['--dump-dom', `file://${html}`])
  const svg = dom.slice(dom.indexOf('<svg id="art"'), dom.indexOf('<!--art-end-->'))
  const { w: tw, h: th } = PIECES[piece]
  const standalone = svg.replace(/^<svg id="art" xmlns="([^"]+)" x="[^"]*" y="[^"]*" width="[^"]*" height="[^"]*"/, `<svg id="art" xmlns="$1" width="${f(tw + 2 * BLEED)}mm" height="${f(th + 2 * BLEED)}mm"`)
  writeFileSync(join(OUT, `${piece}.svg`), '<?xml version="1.0" encoding="UTF-8"?>\n' + standalone)
  run([`--screenshot=${join(OUT, `${piece}.preview.png`)}`, '--window-size=1000,1400', `file://${html}`])
  console.log(`built ${piece}: out/${piece}.pdf, .svg`)
}
