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
        text: 'Strošek dostave je prikazan v košarici in na blagajni, preden oddate naročilo. Nad zneskom, navedenim na vrhu strani, je dostava po Sloveniji brezplačna.',
      },
      {
        heading: 'Rok dostave',
        text: 'Naročila, oddana do 12. ure na delovni dan, odpošljemo isti dan. Paket običajno prejmete v 1–3 delovnih dneh.',
      },
      {
        heading: 'Sledenje pošiljki',
        text: 'Ob odpremi prejmete e-poštno sporočilo s številko za sledenje pošiljki.',
      },
    ],
  },
  {
    slug: 'vracila',
    title: 'Vračila in garancija',
    sections: [
      {
        heading: 'Pravica do odstopa',
        text: 'Potrošnik ima pravico, da v 14 dneh od prejema blaga brez navedbe razloga odstopi od pogodbe. Odstop sporočite pisno na naš e-poštni naslov.',
      },
      {
        heading: 'Pogoji vračila',
        text: 'Izdelek vrnite nepoškodovan, v originalni embalaži in z vso priloženo opremo. Neposredne stroške vračila nosi kupec.',
      },
      {
        heading: 'Vračilo kupnine',
        text: 'Kupnino vrnemo najkasneje v 14 dneh po prejemu obvestila o odstopu, vendar ne prej, kot prejmemo vrnjeno blago.',
      },
      {
        heading: 'Garancija in reklamacije',
        text: 'Za izdelke velja garancija proizvajalca in zakonska odgovornost za stvarne napake. Reklamacijo sporočite na naš e-poštni naslov s številko naročila in opisom napake.',
      },
    ],
  },
  {
    slug: 'zasebnost',
    title: 'Politika zasebnosti',
    sections: [
      {
        heading: 'Upravljavec osebnih podatkov',
        text: 'Upravljavec osebnih podatkov je Brandspot. Vaše podatke obdelujemo v skladu s Splošno uredbo o varstvu podatkov (GDPR) in ZVOP-2.',
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
        text: 'Splošni pogoji veljajo za vse nakupe v spletni trgovini Brandspot. Z oddajo naročila kupec potrjuje, da je seznanjen s pogoji in se z njimi strinja.',
      },
      {
        heading: 'Cene',
        text: 'Vse cene so navedene v evrih (€) in vključujejo DDV. Pridržujemo si pravico do spremembe cen brez predhodnega obvestila.',
      },
      {
        heading: 'Plačilo',
        text: 'Na voljo so načini plačila, prikazani na blagajni ob oddaji naročila.',
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
