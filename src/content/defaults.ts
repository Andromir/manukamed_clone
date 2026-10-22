import { faqs } from '@/data/faq';
import { images } from '@/data/images';
import { policies } from '@/data/policies';
import { stories } from '@/data/stories';

export const contentDefaults = {
  header: {
    topBar: 'Brezplačna dostava po Sloveniji za naročila nad 50 €',
  },
  home: {
    heroImageLeft: images.heroHoney,
    heroImageRight: images.heroLandscape,
    heroEyebrow: 'MGO™ manuka med · Nova Zelandija',
    heroTitleLine1: 'Darilo',
    heroTitleLine2: 'narave',
    heroSubtitle: 'Odkrijte prednosti manuka medu',
    heroButton: 'Nakupuj manuka med',
    introEyebrow: 'Ustvarile čebele, izbrano za vas in vaše bližnje',
    introText:
      'Manuka med iz Nove Zelandije je poznan po vsem svetu kot eno najbolj cenjenih naravnih živil. Smo varuhi tega izjemnega daru narave – vsak kozarec je testiran, certificiran in sledljiv od panja do vaše police.',
    bestsellersTitle: 'Najbolj priljubljeno',
    reasonsImage: images.beekeeper,
    reasonsEyebrow: 'Naša zaveza',
    reasonsTitle: 'Zakaj ManukaMed',
    reasons: [
      {
        title: '100 % iz Nove Zelandije',
        content: 'Naš med prihaja izključno iz neokrnjene divjine Nove Zelandije, kjer manuka grm raste v naravnem okolju.',
      },
      {
        title: 'Trajnostno čebelarjenje',
        content:
          'Med obdelavo ne uporabljamo kemikalij, obrat čistimo le z vodo in recikliramo vse, kar lahko. Za trajnostno čebelarjenje smo prejeli nagrado Univerze Massey.',
      },
      {
        title: 'Certificiran MGO™',
        content: 'Vsaka serija je testirana v laboratoriju s certifikatom ISO 17025, da vsebuje toliko metilglioksala, kot je navedeno na etiketi.',
      },
      {
        title: 'Najvišja kakovost',
        content:
          'Sledljivost od čebelnjaka do police. Temperature v obratu nikoli ne presegajo naravnih temperatur v panju, kar ohranja naravne lastnosti medu.',
      },
    ],
    mgoImage: images.honeySpoonsDark,
    mgoEyebrow: 'Znanost',
    mgoTitle: 'Kaj je MGO v manuka medu?',
    mgoParagraphs: [
      'Leta 2006 so nemški znanstveniki odkrili, da so za edinstveno delovanje manuka medu odgovorne izjemno visoke ravni prehranskega metilglioksala (MGO), ki ga ta med naravno vsebuje.',
      'Številka na etiketi pove najmanjšo vsebnost metilglioksala v mg/kg – višja kot je, močnejši je med.',
    ],
    storiesEyebrow: 'Spoznajte',
    storiesTitle: 'Zgodba manuka medu',
  },
  shop: {
    features: [
      {
        image: images.honeySpoonsDark,
        eyebrow: 'Znanost',
        title: 'Kaj je MGO v manuka medu?',
        text: 'Metilglioksal (MGO) je naravno prisotna sestavina, ki se v večjih koncentracijah nahaja le v nekaterih sortah manuka medu iz Nove Zelandije. Vsako serijo testiramo in certificiramo.',
        linkTo: '/spoznajte/o-manuka-medu',
        linkLabel: 'Več o MGO',
      },
      {
        image: images.beekeeperField,
        eyebrow: 'Trajnost',
        title: 'Skrb za čebele in trajnostne prakse',
        text: 'Med obdelavo medu ne uporabljamo nikakršnih kemikalij, obrat pa čistimo le z vodo. Naš zaprt sistem tople vode je zasnovan tako, da čim več vode recikliramo.',
        linkTo: '/spoznajte/trajnostni-razvoj',
        linkLabel: 'Več o trajnostnem razvoju',
      },
      {
        image: images.breakfast,
        eyebrow: 'Od panja do mize',
        title: 'Sledljivost od čebelnjaka do police',
        text: 'Vse surovine morajo izpolnjevati naše stroge standarde kakovosti in varnosti. Vsaka serija je preizkušena v laboratoriju s certifikatom ISO 17025.',
        linkTo: '/spoznajte/zagotavljanje-kakovosti',
        linkLabel: 'Zagotavljanje kakovosti',
      },
    ],
  },
  product: {
    shippingNote: 'Naročila do 12. ure odpošljemo isti dan.',
    returnsText: 'Neodprte izdelke lahko vrnete v 14 dneh od prejema.',
    storageText: 'Hraniti pri sobni temperaturi (do 25 °C), na suhem in stran od neposredne svetlobe.',
    lifestyleImage: images.woman,
  },
  promo: {
    enabled: true,
    tabLabel: '10 % popusta',
    image: images.honeySpoonsDark,
    eyebrow: 'Dobrodošli v ManukaMed',
    title: '10 % popusta',
    titleAccent: 'na prvi nakup',
    text: 'Prijavite se na e-novice in prejmite kodo za popust ter ekskluzivne ponudbe.',
    button: 'Pridobi kodo',
    code: 'DOBRODOSLI10',
  },
  footer: {
    newsletterTitle: 'Ostanimo povezani',
    newsletterText: 'Prijavite se na e-novice in prejmite 10 % popusta na prvi nakup, recepte in novice iz sveta manuka medu.',
    newsletterCode: 'DOBRODOSLI10',
    instagram: '',
    facebook: '',
    youtube: '',
    copyright: 'ManukaMed. Vse pravice pridržane.',
  },
  contact: {
    heroImage: images.tea,
    eyebrow: 'Kontakt',
    title: 'Pišite nam',
    lead: 'Z veseljem vam svetujemo pri izbiri pravega manuka medu.',
    email: 'info@manukamed.si',
    phone: '+386 1 234 56 78',
    address: 'Ljubljana, Slovenija',
    hours: 'Pon–pet: 8.00–16.00',
  },
  images,
  faq: { items: faqs },
  policies: { items: policies },
  stories: { items: stories },
};

export type ContentDefaults = typeof contentDefaults;
export type ContentKey = keyof ContentDefaults;
