import { faqs } from '@/data/faq';
import { policies } from '@/data/policies';

export const contentDefaults = {
  header: {
    topBar: 'Brezplačna dostava po Sloveniji za naročila nad 50 €',
  },
  home: {
    heroImage: '',
    heroEyebrow: 'Spletna trgovina z elektroniko',
    heroTitleLine1: 'Tehnologija,',
    heroTitleLine2: 'ki šteje.',
    heroSubtitle: 'Telefoni, računalniki, TV in omrežna oprema vodilnih znamk – z dostavo po vsej Sloveniji.',
    heroButton: 'Nakupuj zdaj',
    categoriesTitle: 'Nakupujte po kategorijah',
    bestsellersTitle: 'Izpostavljeno',
    reasonsEyebrow: 'Zakaj Brandspot',
    reasonsTitle: 'Nakupovanje brez skrbi',
    reasons: [
      { title: 'Hitra dostava', content: 'Naročila, oddana do 12. ure, odpošljemo isti delovni dan.' },
      { title: 'Garancija', content: 'Vsi novi izdelki imajo garancijo proizvajalca in podporo pri reklamacijah.' },
      { title: 'Varno plačilo', content: 'Plačilo po povzetju, z bančnim nakazilom ali s kartico prek šifrirane povezave.' },
      { title: 'Pomoč pri izbiri', content: 'Ne veste, kaj izbrati? Pišite ali pokličite nas in skupaj najdemo pravo napravo.' },
    ],
  },
  product: {
    shippingNote: 'Naročila do 12. ure odpošljemo isti delovni dan.',
    returnsText: 'Izdelek lahko vrnete v 14 dneh od prejema brez navedbe razloga.',
    highlights: [
      { title: 'Hitra dostava', text: '1–3 delovne dni' },
      { title: 'Garancija', text: 'Za vse nove izdelke' },
      { title: 'Vračilo v 14 dneh', text: 'Brez navedbe razloga' },
      { title: 'Varno plačilo', text: 'Šifrirana povezava' },
    ],
  },
  promo: {
    enabled: true,
    tabLabel: '10 % popusta',
    image: '',
    eyebrow: 'Dobrodošli v Brandspot',
    title: '10 % popusta',
    titleAccent: 'na prvi nakup',
    text: 'Prijavite se na e-novice in prejmite kodo za popust ter obvestila o novostih in akcijah.',
    button: 'Pridobi kodo',
    code: 'DOBRODOSLI10',
  },
  footer: {
    newsletterTitle: 'Ostanimo povezani',
    newsletterText: 'Prijavite se na e-novice in prejmite 10 % popusta na prvi nakup ter obvestila o novostih in akcijah.',
    newsletterCode: 'DOBRODOSLI10',
    instagram: '',
    facebook: '',
    youtube: '',
    copyright: 'Brandspot. Vse pravice pridržane.',
  },
  contact: {
    eyebrow: 'Kontakt',
    title: 'Pišite nam',
    lead: 'Z veseljem vam pomagamo pri izbiri naprave ali pri vprašanjih o naročilu.',
    email: 'info@brandspot.si',
    phone: '+386 40 758 578',
    address: '',
    hours: '',
  },
  faq: { items: faqs },
  policies: { items: policies },
};

export type ContentDefaults = typeof contentDefaults;
export type ContentKey = keyof ContentDefaults;
