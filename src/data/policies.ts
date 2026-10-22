export interface Policy {
  slug: string;
  title: string;
  sections: { heading: string; text: string }[];
}

export const policies: Policy[] = [
  {
    slug: 'dostava',
    title: 'Dostava',
    sections: [
      {
        heading: 'Stroški dostave',
        text: 'Dostava po Sloveniji stane 3,90 €. Za naročila v vrednosti nad 50 € je dostava brezplačna.',
      },
      {
        heading: 'Rok dostave',
        text: 'Naročila, oddana do 12. ure na delovni dan, odpošljemo isti dan. Paket običajno prejmete v 1–2 delovnih dneh.',
      },
      {
        heading: 'Načini dostave',
        text: 'Pakete dostavljamo s Pošto Slovenije in z dostavno službo GLS. Ob odpremi prejmete e-poštno sporočilo s številko za sledenje.',
      },
    ],
  },
  {
    slug: 'vracila',
    title: 'Vračila in odstop od pogodbe',
    sections: [
      {
        heading: 'Pravica do odstopa',
        text: 'Potrošnik ima pravico, da v 14 dneh od prejema blaga brez navedbe razloga odstopi od pogodbe. Odstop sporočite pisno na naš e-poštni naslov.',
      },
      {
        heading: 'Pogoji vračila',
        text: 'Zaradi higienskih razlogov lahko vrnete le neodprte izdelke z nepoškodovano zaščitno folijo. Neposredne stroške vračila nosi kupec.',
      },
      {
        heading: 'Vračilo kupnine',
        text: 'Kupnino vrnemo najkasneje v 14 dneh po prejemu obvestila o odstopu, vendar ne prej, kot prejmemo vrnjeno blago.',
      },
    ],
  },
  {
    slug: 'zasebnost',
    title: 'Politika zasebnosti',
    sections: [
      {
        heading: 'Upravljavec osebnih podatkov',
        text: 'Upravljavec osebnih podatkov je ManukaMed. Vaše podatke obdelujemo v skladu s Splošno uredbo o varstvu podatkov (GDPR) in ZVOP-2.',
      },
      {
        heading: 'Namen obdelave',
        text: 'Podatke uporabljamo izključno za izvedbo naročil, komunikacijo s kupci in – če ste v to privolili – za pošiljanje e-novic.',
      },
      {
        heading: 'Vaše pravice',
        text: 'Kadarkoli lahko zahtevate vpogled, popravek ali izbris svojih podatkov ter prekličete privolitev za prejemanje e-novic.',
      },
    ],
  },
  {
    slug: 'pogoji-poslovanja',
    title: 'Splošni pogoji poslovanja',
    sections: [
      {
        heading: 'Splošno',
        text: 'Splošni pogoji veljajo za vse nakupe v spletni trgovini ManukaMed. Z oddajo naročila kupec potrjuje, da je seznanjen s pogoji in se z njimi strinja.',
      },
      {
        heading: 'Cene',
        text: 'Vse cene so navedene v evrih (€) in vključujejo DDV. Pridržujemo si pravico do spremembe cen brez predhodnega obvestila.',
      },
      {
        heading: 'Plačilo',
        text: 'Plačilo je mogoče s plačilno kartico, prek PayPala, z bančnim nakazilom ali po povzetju.',
      },
    ],
  },
  {
    slug: 'piskotki',
    title: 'Piškotki',
    sections: [
      {
        heading: 'Kaj so piškotki',
        text: 'Piškotki so majhne datoteke, ki se shranijo na vaši napravi in omogočajo pravilno delovanje spletne trgovine, npr. shranjevanje vsebine košarice.',
      },
      {
        heading: 'Upravljanje piškotkov',
        text: 'Piškotke lahko kadarkoli izbrišete ali onemogočite v nastavitvah svojega brskalnika.',
      },
    ],
  },
];
