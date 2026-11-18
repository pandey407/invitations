// The reception: https://invite.ashleshpandey.com.np/reception (the guest-list sheet's links for guests invited to
// the reception only). The wedding's card (src/events/wedding: envelope, pages and all its text) with just the
// reception and the contacts; only what differs is here. Edit the reception's date, time and place in
// ../wedding/content.ts (programme.reception), which both cards share.
import { wedding } from '../wedding/content.ts'

export const reception = {
  ...wedding,
  slug: 'reception', // the URL path: /reception
  occasion: { np: 'प्रीतिभोज', en: 'Wedding Reception' },
  sides: {
    both: {
      path: '',
      first: 'groom',
      parts: ['reception'],
      contacts: ['9841419906', '9864155123'],
      familyLine: { np: 'विनीत: पाण्डे परिवार', en: 'With love, the Pandey family' },
    },
  },
  kicker: { np: 'शुभ विवाहको प्रीतिभोज', en: 'The Wedding Reception of' },
  // under the names in the arch (no सपरिवार: the चु: on the envelope says who's invited)
  invitation: {
    np: 'हाम्रो प्रीतिभोजमा यहाँको उपस्थिति र आशीर्वादको अपेक्षा गर्दछौं',
    en: 'We look forward to your presence and blessings at our reception',
  },
  showParents: false, // just the first names in the arch
  showSindoor: false, // the sindoor box and potey belong to the wedding ceremony

} as const
