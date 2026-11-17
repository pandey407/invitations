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
  invitation: {
    np: 'हाम्रो विवाहको उपलक्ष्यमा आयोजित प्रीतिभोजमा तपाईंलाई सपरिवार हार्दिक निमन्त्रणा गर्दछौं',
    en: 'Together with our families, we joyfully invite you to celebrate our wedding reception',
  },
  showSindoor: false, // the sindoor box and potey belong to the wedding ceremony

} as const
