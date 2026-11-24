// ALL TEXT FOR THIS EVENT LIVES IN THIS FILE. Edit here; nothing else needs to change.
// Pairs like { np, en }: guests see ONE language at a time (toggle at the top; Nepali by default,
// `?lang=en` in the link opens it in English). Write both versions of every pair.
//
// The wedding, in two versions:
//   https://invite.ashleshpandey.com.np/wedding          the groom's side (the guest-list sheet's links): the janti
//                                                        departure, the wedding and the reception, and contacts
//   https://invite.ashleshpandey.com.np/wedding/aarusha  the bride's side: just the wedding
// Personal links (the guest's name and चुलेनिम्तो stamp on the envelope) come from the guest-list sheet:
// scripts/wedding/invite-links.gs.

export const wedding = {
  slug: 'wedding', // the URL path: /wedding
  siteUrl: 'https://invite.ashleshpandey.com.np/',
  // The guest sheet's "Sent links" web app (scripts/wedding/sent-links.gs, its …/exec URL): the link maker saves each
  // link there, and a card opened from a saved link takes its times from that row. Empty: links carry their times only.
  savedLinks: 'https://script.google.com/macros/s/AKfycbxdgtsUEdRcJ6y1z5HQcl3JgY63J0hIXsbRoCdQ5eKxu32f7qGQmfcHOf3wE2kWslR3hQ/exec',
  // Google Fonts for this event's design (envelope's निमन्त्रणा: Yatra One; the चु: stamp: Kalam; names: Parisienne, and Laila for Nepali; text: Cormorant Garamond + Noto Serif Devanagari)
  fonts:
    'https://fonts.googleapis.com/css2?family=Yatra+One&family=Kalam:wght@700&family=Parisienne&family=Laila:wght@400;600&family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400;1,500&family=Noto+Serif+Devanagari:wght@400;500;600&display=swap',
  icon: 'favicon-wedding.svg', // browser-tab icon (public/): the gathbandhan knot on soft rose
  themeColor: '#cf9b93', // phone browser toolbar: the envelope's soft rose

  couple: {
    bride: { np: 'आरुषा', en: 'Aarusha' },
    groom: { np: 'अस्लेष', en: 'Ashlesh' },
  },
  // Which parts of the day each version lists (keys of `programme` below), its contact numbers, and its sign-off.
  sides: {
    both: {
      path: '',
      first: 'groom',
      parts: ['janti', 'ceremony', 'reception'],
      times: {}, // this card's own times where they differ from the programme's below, e.g. { ceremony: '10:00' }
      contacts: ['9841419906', '9864155123'],
      familyLine: { np: 'विनीत: पाण्डे परिवार', en: 'With love, the Pandey family' },
    },
    bride: {
      path: 'aarusha',
      first: 'bride',
      parts: ['ceremony'],
      contacts: ['9851163426', '9717247562'],
      familyLine: { np: 'विनीत: लुइटेल परिवार', en: 'With love, the Luitel family' },
    },
  },
  and: { np: 'र', en: '&' },
  occasion: { np: 'शुभ विवाह', en: 'Wedding' },

  // ── Opening envelope ───────────────────────────────────────────────────────────────
  // Sanskrit prayers: shown as written in both languages. Under the knot, then the invocation.
  shloka: ['वक्रतुण्ड महाकाय सूर्यकोटि समप्रभ ।', 'निर्विघ्नं कुरु मे देव सर्वकार्येषु सर्वदा ॥'],
  invocation: 'श्री गणेशाय नमः',
  nimantrana: 'निमन्त्रणा', // on a personal link: in a flowing hand over the guest's name
  openLabel: 'Open invitation', // read out by screen readers for the tap-to-open button

  // ── Opening (inside the gold arch, bells above) ────────────────────────────────────
  // In the arch: each of us by full name, and under it, in brackets, whose son or daughter (on the reception card
  // too; showParents: false would show just the first names).
  showParents: true,
  fullNames: {
    groom: { np: 'अस्लेष पाण्डे', en: 'Ashlesh Pandey' },
    bride: { np: 'आरुषा लुइटेल', en: 'Aarusha Luitel' },
  },
  parents: {
    groom: { np: 'सुपुत्र: श्रीमान् माधव प्रसाद पाण्डे तथा श्रीमती निर्मला पाण्डे', en: 'son of Mr Madhav Prasad Pandey & Mrs Nirmala Pandey' },
    bride: { np: 'सुपुत्री: श्रीमान् राज कुमार लुइटेल तथा श्रीमती शोभा लुइटेल', en: 'daughter of Mr Raj Kumar Luitel & Mrs Shova Luitel' },
  },
  kicker: { np: 'शुभ विवाह', en: 'The Wedding of' },
  // under the names in the arch (no सपरिवार: the चु: on the envelope says who's invited)
  invitation: {
    np: 'यस मंगल घडीमा यहाँको आशीर्वादको अपेक्षा गर्दछौं',
    en: 'We seek your blessings on this auspicious day',
  },

  // ── Saptapadi (the seven steps) ────────────────────────────────────────────────────
  steps: {
    heading: { np: 'सप्तपदी', en: 'Seven Steps' },
    line: { np: 'सात पाइला, सात वचन — जीवनभरको साथ।', en: 'Seven steps, seven promises, one life together.' },
    blessing: {
      np: 'तपाईंको उपस्थिति र आशीर्वादले हाम्रो यो शुभ दिन अझ पूर्ण हुनेछ।',
      en: 'Your presence and blessings will make our day complete.',
    },
  },

  // ── When & where: one card per part of the day (each version lists its own `parts`, see `sides`) ──
  details: {
    heading: { np: 'मिति सम्झनुहोला', en: 'Save the Date' },
    directions: { np: 'नक्सा हेर्नुहोस्', en: 'Get directions' },
  },
  // Each: its title, date, time (`at`, 24-hour; a link from /wedding/settings can carry others) and place. A line
  // left empty ('') is simply not shown.
  // mapLink: Google Maps → Share → Copy link (the place name and the directions button open it).
  programme: {
    janti: {
      title: { np: 'जन्ती प्रस्थान', en: 'Janti Procession' },
      date: { np: 'मंसिर ९, २०८३ बुधवार', en: 'Wednesday, 25 November 2026' },
      at: '08:30', // 24-hour; the card says it in words (src/events/wedding/times.ts)
      onwards: false,
      place: { np: 'निजी निवास', en: 'Niji Niwas' },
      address: { np: 'रानीबारी, काठमाडौं', en: 'Ranibari, Kathmandu' },
      mapLink: 'https://www.google.com/maps/search/?api=1&query=27.7311005%2C85.3202482', // Niji Niwas: a pin (the shared links only saved a map view)
    },
    ceremony: {
      title: { np: 'शुभ विवाह', en: 'Wedding Ceremony' },
      date: { np: 'मंसिर ९, २०८३ बुधवार', en: 'Wednesday, 25 November 2026' },
      at: '10:30', // both sides (a side can differ: sides.<side>.times)
      onwards: false,
      place: { np: 'लर्ड प्यालेस ब्यांक्वेट', en: 'Lord Palace Banquet' },
      address: { np: 'टोखा रोड, काठमाडौं', en: 'Tokha Road, Kathmandu' },
      mapLink: 'https://maps.app.goo.gl/rdMf1VE2jJzrhR2Y6',
    },
    reception: {
      title: { np: 'प्रीतिभोज', en: 'Reception' },
      date: { np: 'मंसिर १०, २०८३ बिहीबार', en: 'Thursday, 26 November 2026' },
      at: '17:30',
      onwards: true, // "from 5:30 PM": साँझ ५:३० बजेदेखि / 5:30 PM onwards
      place: { np: 'कान्तिपुर एबी पार्टी प्यालेस', en: 'Kantipur AB Party Palace' },
      address: { np: 'नेपालटार, काठमाडौं', en: 'Nepaltar, Kathmandu' },
      mapLink: 'https://maps.app.goo.gl/DcE3vnBYZpbwbkkLA',
    },
  },

  // ── Contact numbers (each version's own, in `sides`) ───────────────────────────────
  contactsHeading: { np: 'असमर्थताका लागि', en: 'For any help, call' }, // at the foot of the page

  showSindoor: false, // the sindoor box and potey over the programme (off for now; the reception never has it)

  // ── Closing (under the kalash) ─────────────────────────────────────────────────────
  closing: { np: 'तपाईंको प्रतीक्षामा', en: 'With love, we await you' },
} as const
