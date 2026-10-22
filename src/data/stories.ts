import { images } from '@/data/images';

export interface StoryTable {
  caption: string;
  head: string[];
  rows: string[][];
}

export interface StorySection {
  heading?: string;
  paragraphs: string[];
  list?: { term: string; text: string }[];
  table?: StoryTable;
  note?: string;
}

export interface Story {
  slug: string;
  title: string;
  eyebrow: string;
  lead: string;
  hero: string;
  card: string;
  sections: StorySection[];
}

export const stories: Story[] = [
  {
    slug: 'o-manuka-medu',
    title: 'O manuka medu',
    eyebrow: 'Spoznajte manuka med',
    lead: 'Manuka med iz Nove Zelandije je poznan po vsem svetu kot eno najbolj cenjenih naravnih živil.',
    hero: images.manukaFlower,
    card: images.honeySpoonsDark,
    sections: [
      {
        paragraphs: [
          'MGO™ manuka med iz Nove Zelandije je 100 % naravno živilo, z dokazano učinkovito in zanesljivo protimikrobno učinkovitostjo.',
          'Namenjen je tako za zunanjo kot notranjo uporabo. Ob tem uravnava in podpira procese v telesu, ki skrbijo za zdrav razvoj celic in krepijo imunski sistem.',
        ],
      },
      {
        heading: 'Lastnosti',
        paragraphs: [
          'MGO™ manuka med je monofloralni med, ki se proizvaja na Novi Zelandiji iz cvetov manuka grma (Leptospermum scoparium). Pripomore k zagotavljanju zdravega in dobrega počutja.',
        ],
      },
      {
        heading: 'Niso vse sorte manuka medu enake',
        paragraphs: [
          'Leta 2006 so nemški znanstveniki odkrili, da so za edinstveno in zanesljivo protimikrobno delovanje manuka medu odgovorne izjemno visoke ravni prehranskega metilglioksala, ki ga ta med naravno vsebuje.',
          'Ostale testirane sorte medu po svetu imajo nizko vsebnost metilglioksala (MGO), v koncentracijah med 0 in 5 mg/kg. Pomembno je vedeti, da se vsebnost metilglioksala lahko zelo razlikuje med različnimi sortami manuka medu, zato se je dobro prepričati, kaj kupujete.',
          'Prav zato testiramo in certificiramo vsako serijo MGO™ manuka medu, saj tako zagotavljamo tolikšno vsebnost metilglioksala, kot je navedena na etiketi.',
        ],
        table: {
          caption: 'Naravna vsebnost metilglioksala',
          head: ['Vrsta medu', 'MGO (mg/kg)'],
          rows: [
            ['Manuka med', '100 – 800+'],
            ['Ostale sorte medu', '0 – 5'],
          ],
        },
      },
      {
        heading: 'Parametri testiranja kakovosti',
        paragraphs: [],
        list: [
          {
            term: 'Metilglioksal (MGO)',
            text: 'Ključna sestavina manuka medu; naravno prisotna sestavina, ki se v večjih koncentracijah nahaja le v nekaterih sortah manuka medu iz Nove Zelandije.',
          },
          {
            term: 'DHA (dihidroksiaceton)',
            text: 'Naravno prisotna sestavina nektarja cvetov manuka grma in predhodnica metilglioksala.',
          },
          {
            term: 'Parameter kakovosti 1',
            text: 'Indikator svežine – HMF (hidroksimetilfurfural) in aktivnost diastaze (encimska aktivnost).',
          },
          {
            term: 'Parameter kakovosti 2',
            text: 'Indikator čistosti – mikrobakterije in ostanki kemičnih sredstev v medu.',
          },
        ],
      },
      {
        heading: 'Naj govorijo dejstva',
        paragraphs: [
          'Manuka Health je bila prva na svetu, ki je začela meriti vsebnost metilglioksala v manuka medu. MGO™ 100+ manuka med je na primer testiran in certificiran, da vsebuje vsaj 100 mg/kg prehranskega metilglioksala.',
        ],
        note: 'V skladu z veljavno zakonodajo se v Sloveniji ne sme spodbujati in promovirati zdravilnih učinkov hrane, zato predvidevamo, da si boste lahko, če je to potrebno, pridobili vse potrebne podatke o številnih področjih delovanja manuka medu sami.',
      },
    ],
  },
  {
    slug: 'vodilni-v-panogi',
    title: 'Vodilni v panogi',
    eyebrow: 'MGO™ manuka med',
    lead: 'Prvi na svetu z natančnim in strogim znanstvenim sistemom certificiranja novozelandskega manuka medu.',
    hero: images.honeyDripDark,
    card: images.honeyDripDark,
    sections: [
      {
        paragraphs: [
          'Manuka Health je prvo podjetje na svetu, ki je vzpostavilo natančen in strog znanstveni sistem certificiranja novozelandskega manuka medu na podlagi koncentracij naravno prisotne aktivne učinkovine metilglioksal (MGO). Takšen sistem certificiranja je plod raziskave, ki so jo izvedli na Inštitutu za kemijo hrane na Tehnični univerzi v Dresdnu v Nemčiji, vodil pa jo je profesor Thomas Henle.',
          'Profesor Henle in njegova ekipa so bili prvi, ki so dokumentirali metilglioksal (MGO) kot tisto sestavino, ki prispeva k edinstvenim značilnostim manuka medu in ga razlikuje od ostalih vrst medu. Pred tem odkritjem so za poimenovanje posebnega delovanja manuka medu uporabljali izraz »edinstven manuka dejavnik« (UMF – Unique Manuka Factor).',
          'Ta raziskava zdaj nudi jasnejše načine merjenja ključne sestavine manuka medu, testiranje metilglioksala (MGO) pa je tako postalo priznan standard za laboratorije in proizvajalce manuka medu.',
        ],
      },
    ],
  },
  {
    slug: 'zagotavljanje-kakovosti',
    title: 'Zagotavljanje kakovosti',
    eyebrow: 'Od izvora do police',
    lead: 'Zagotavljamo kakovost … od izvora, do police.',
    hero: images.honeycomb,
    card: images.beesOnComb,
    sections: [
      {
        paragraphs: [
          'Razvijamo, proizvajamo in tržimo svoje izdelke, saj tako zagotavljamo vrhunsko kakovost na vsaki stopnji.',
          'Naš obsežen sistem omogoča sledljivost od čebelnjaka do police. Vse surovine, ki jih uporabljamo v naših izdelkih, morajo izpolnjevati naše stroge standarde kakovosti in varnosti, saj tako vzdržujemo nivo bioaktivnih snovi.',
          'Vsaka serija MGO™ manuka medu je preizkušena v hišnem laboratoriju s certifikatom ISO 17025. Tukaj pregledamo vse, od surovin do končnega izdelka, in tako nadzorujemo ter zagotavljamo nivo bioaktivnih sestavin.',
        ],
      },
      {
        heading: 'Odgovornost',
        paragraphs: [
          'Zagotovljena kakovost, ki ji lahko zaupate. Vsaka serija manuka medu je temeljito testirana. S tem zagotavljamo kakovost in čistost izdelka, ki ga nato pazljivo zapakiramo v specializiranem objektu za predelavo medu v mestu Te Awamutu na Novi Zelandiji.',
          'Pazljivost pri delu ohranja naravne lastnosti medu; temperature v obratu nikoli ne presegajo naravnih temperatur, ki jih najdemo v čebeljih panjih.',
        ],
      },
    ],
  },
  {
    slug: 'trajnostni-razvoj',
    title: 'Trajnostni razvoj',
    eyebrow: 'Skrb za čebele in naravo',
    lead: 'Prizadevamo si za trajnostne prakse v čebelarjenju, žetvi in pridelavi naših izdelkov.',
    hero: images.beekeeper,
    card: images.beekeeperField,
    sections: [
      {
        paragraphs: [
          'Avtohtona flora in favna sta se na Novi Zelandiji razvijali v izolaciji več kot 80 milijonov let, kar je vodilo do nekaj najvišjih koncentracij naravnih bioaktivnih spojin, ki jih ne najdemo nikjer drugje na svetu.',
          'S ponosom predstavljamo te edinstvene izdelke in si prizadevamo za trajnostne prakse v čebelarjenju, žetvi in pridelavi.',
          'Med obdelavo medu ne uporabljamo nikakršnih kemikalij, obrat pa čistimo le z vodo. V okolje znotraj ali zunaj obrata ne vstopa nobeno kemično čistilo.',
          'Naš zaprt sistem tople vode je zasnovan tako, da čim več vode recikliramo. Ponovno uporabimo ves material, ki ga lahko, in recikliramo v predelovalnem obratu, skladišču in pisarnah.',
          'Zavzemamo se za uporabo najbolj trajnostnih poslovnih praks, s katerimi zmanjšujemo vpliv na naše čudovito in edinstveno okolje.',
        ],
      },
      {
        heading: 'Priznanje za trajnostno čebelarjenje',
        paragraphs: [
          'Za čebelarjenje smo leta 2011 prejeli nagrado Univerze Massey na podelitvi okoljevarstvenih nagrad za uravnoteženo kmetovanje – priznanje za nova odkritja in izvajanje ekonomsko in okoljsko trajnostnih načinov kmetovanja.',
        ],
      },
    ],
  },
  {
    slug: 'nase-okolje',
    title: 'Naše okolje',
    eyebrow: 'Nova Zelandija',
    lead: 'Majhna otoška država z rastlinami, ki jih ne najdemo nikjer drugje na svetu.',
    hero: images.nzLake,
    card: images.nzHills,
    sections: [
      {
        paragraphs: [
          'Nova Zelandija je majhna otoška država, ki je nastala pred približno 80 milijoni let, ko se je ločila od Avstralije. Med njima je danes skoraj 2000 kilometrov oceana.',
          'Velik del neokrnjene narave Nove Zelandije je poraščen z avtohtonim gozdom. Zmerna klima in skrajna oddaljenost otokov sta povzročili razvoj povsem edinstvenih živalskih in rastlinskih vrst. Od 2000 avtohtonih rastlinskih vrst jih približno 1500 ne najdemo nikjer drugje na svetu.',
        ],
      },
      {
        heading: 'Modrost Maorov',
        paragraphs: [
          'Maori, ki so na novozelandske obale prispeli okoli leta 700 n. št., so prvi odkrili, da so snovi avtohtonih rastlin blagodejne tudi za ljudi. Poznavanje krepilnih moči novozelandskih rastlin predstavlja osnovo t. i. Rongoa Maori – tradicionalnega znanja, ki ga Maori uporabljajo še danes.',
          'Evropski naseljenci, ki so prispeli v začetku 19. stoletja, so pogosto živeli daleč od zdravnikov in so začeli ceniti na videz »čudežne moči« avtohtonih rastlin, s katerimi so bili obdani.',
        ],
      },
      {
        heading: 'Rojstvo manuka medu',
        paragraphs: [
          'Prvi naseljenci so s seboj prinesli domače čebele, ki so zbirale nektar v avtohtonih gozdovih, zlasti na grmu manuka, ki v divjini raste po vsej Novi Zelandiji. Čebele nektar koncentrirajo – tako nastane manuka med.',
          'Manuka med je pred več kot 30 leti pritegnil pozornost profesorja Petra Molana z Univerze Waikato, njegovo delo pa je potrdilo izjemne lastnosti tega medu.',
        ],
      },
    ],
  },
];
