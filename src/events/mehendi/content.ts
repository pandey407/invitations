// ALL TEXT FOR THIS EVENT LIVES IN THIS FILE. Edit here; nothing else needs to change.
// Pairs like { np, en }: guests see ONE language at a time (toggle at the top; Nepali by default,
// `?lang=en` in the link opens it in English). Write both versions of every pair.
//
// The bride's mehendi: one link, https://invite.ashleshpandey.com.np/mehendi
// No envelope for this event: the page opens straight onto the henna frame.

export const mehendi = {
  slug: 'mehendi', // the URL path: /mehendi
  siteUrl: 'https://invite.ashleshpandey.com.np/',
  // Google Fonts for this event's design (script: Great Vibes, and Kalam for Nepali; text: Cormorant Garamond + Noto Serif Devanagari)
  fonts:
    'https://fonts.googleapis.com/css2?family=Great+Vibes&family=Kalam:wght@700&family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500&family=Noto+Serif+Devanagari:wght@400;500;600;700&display=swap',

  only: 'bride', // whose mehendi it is: the page and its title name just her
  name: 'Henna Hues', // the event's own name: leads the page title and link preview
  couple: {
    bride: { np: 'आरुषा', en: 'Aarusha' },
    groom: { np: 'अश्लेष', en: 'Ashlesh' },
  },
  sides: {
    both: { path: '', first: 'bride' },
  },
  and: { np: 'र', en: '&' },
  occasion: { np: 'मेहन्दी र संगीत', en: 'Mehendi & Sangeet' }, // the page title and link preview
  // The event's name: the two big script lines in the arch.
  headline: [
    { np: 'मेहन्दीका', en: 'Henna' },
    { np: 'रंग', en: 'Hues' },
  ],

  // ── Opening arch ───────────────────────────────────────────────────────────────────
  // English reads: kicker / invitation / Henna Hues / Mehendi & Sangeet / of / Aarusha / tagline
  // Nepali reads:  kicker / आरुषाको / मेहन्दीका रंग / मेहन्दी र संगीत उत्सवमा / invitation / tagline
  kicker: { np: 'मेहन्दी, गीत र नाच', en: 'Henna, music & dancing' },
  invitation: { np: 'हार्दिक निमन्त्रणा', en: 'With great joy, we invite you to' },
  ceremony: { np: 'मेहन्दी र संगीत उत्सवमा', en: 'Mehendi & Sangeet' },
  of: { np: '', en: 'of' },
  possessive: { np: 'को', en: "'s" }, // "आरुषाको मेहन्दी र संगीत" / "Aarusha's Mehendi & Sangeet" (also the page title)
  tagline: { np: 'रंग, रमाइलो र रौनक — आउनुहोस्, सँगै नाचौं!', en: 'Henna on our hands, music in the air and dancing all evening!' },

  // ── When & where ───────────────────────────────────────────────────────────────────
  details: {
    heading: { np: 'नबिर्सनुहोस्!', en: 'Mark your calendar!' },
    dateTimeLabel: { np: 'मिति र समय', en: 'Date & time' },
    venueLabel: { np: 'स्थान', en: 'Venue' },
    directions: { np: 'नक्सा हेर्नुहोस्', en: 'Get directions' },
    note: { np: 'नाच्ने जुत्ता लिएर आउनुहोला!', en: 'Bring your dancing shoes!' },
  },
  dateLabel: { np: 'मंसिर ७, २०८३ सोमवार', en: 'Monday, 23 November 2026' },
  time: { np: 'दिउँसो ३ बजेदेखि', en: '3 PM onwards' },
  venue: {
    name: { np: 'एन स्पेस', en: 'En Space' },
    address: { np: 'चुनदेवी, बक्रारेखा गल्ली, काठमाडौं', en: 'Chundevi, Bakrarekha Galli, Kathmandu' },
    // Google Maps → Share → Embed a map → copy the src="..." URL (left empty: the painted page has a directions
    // button instead of an embedded map)
    mapEmbedUrl: '',
    // Google Maps → Share → Copy link (the venue name and the directions button open this)
    mapLink: 'https://maps.app.goo.gl/neokGMaP1821tLvd9', // En Space on Google Maps
    mapTitle: 'Map to the venue', // read out by screen readers
  },

  // ── Closing (under the mandala) ────────────────────────────────────────────────────
  closing: { np: 'रंगीन वाचा', en: 'Painted Promises' },
  closingNote: { np: 'मेहन्दीको हरेक बुट्टामा, जीवनभरको माया।', en: 'In every swirl of henna, a promise of forever.' },
} as const
