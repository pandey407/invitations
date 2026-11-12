import { invite } from './invite'

// Google Fonts only downloads a script's file when a character first needs it, so switching language could
// flash a fallback font. Load every face the page uses, for all of the invite's text in both languages.
const allText = (value: unknown): string =>
  typeof value === 'string' ? value : Array.isArray(value) ? value.map(allText).join(' ') : value && typeof value === 'object' ? Object.values(value).map(allText).join(' ') : ''

const FACES = [
  '400 1em "Great Vibes"',
  '700 1em "Kalam"',
  '400 1em "Cormorant Garamond"',
  '500 1em "Cormorant Garamond"',
  '600 1em "Cormorant Garamond"',
  'italic 400 1em "Cormorant Garamond"',
  '400 1em "Noto Serif Devanagari"',
  '500 1em "Noto Serif Devanagari"',
  '600 1em "Noto Serif Devanagari"',
]

export function preloadFonts() {
  const text = allText(invite) + ' ०१२३४५६७८९ 0123456789'
  return Promise.allSettled(FACES.map((face) => document.fonts.load(face, text)))
}
