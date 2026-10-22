import { Link } from 'react-router-dom';
import Reveal from '@/components/ui/Reveal';

const rows = [
  ['Visoka naravna vsebnost MGO', 'Nizka vsebnost MGO'],
  ['Monofloralen – iz cvetov manuke', 'Mešanica različnih cvetov'],
  ['Certificirana stopnja MGO™', 'Brez standardizirane stopnje'],
  ['100 – 800+ mg/kg metilglioksala', '0 – 5 mg/kg metilglioksala'],
  ['Gost, zemeljski in kompleksen okus', 'Lahek, sladek in tekoč'],
];

export default function ComparisonPanel() {
  return (
    <section className="grid lg:grid-cols-2">
      <div className="grid grid-cols-2">
        <div className="bg-honey-600 px-5 py-14 text-white sm:px-10 sm:py-20">
          <h3 className="text-3xl font-normal uppercase leading-none tracking-[0.1em] sm:text-5xl">
            Manuka
            <br />
            med
          </h3>
          <ul className="mt-12 space-y-0">
            {rows.map(([a]) => (
              <li key={a} className="flex min-h-[72px] items-center border-t border-white/40 text-xs leading-snug sm:text-sm">
                {a}
              </li>
            ))}
          </ul>
        </div>
        <div className="relative bg-honey-400 px-5 py-14 text-navy-950 sm:px-10 sm:py-20">
          <span className="absolute -left-6 top-16 flex h-12 w-12 items-center justify-center rounded-full bg-white text-xs font-medium uppercase tracking-widest text-honey-600 shadow-lg sm:top-24">
            vs.
          </span>
          <h3 className="text-3xl font-normal uppercase leading-none tracking-[0.1em] sm:text-5xl">
            Ostali
            <br />
            med
          </h3>
          <ul className="mt-12">
            {rows.map(([, b]) => (
              <li key={b} className="flex min-h-[72px] items-center border-t border-navy-950/25 text-xs leading-snug sm:text-sm">
                {b}
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="flex items-center bg-white px-6 py-16 sm:px-16 lg:px-20">
        <Reveal className="max-w-md">
          <p className="eyebrow">Primerjava</p>
          <h2 className="heading-lg mt-4">Manuka med v primerjavi z ostalimi vrstami medu</h2>
          <p className="mt-6 text-sm leading-relaxed text-navy-800/75">
            Ostale testirane sorte medu po svetu imajo nizko vsebnost metilglioksala (MGO), v koncentracijah med 0 in 5 mg/kg. Manuka med iz
            Nove Zelandije ga naravno vsebuje bistveno več – zato je poznan po vsem svetu kot eno najbolj cenjenih naravnih živil.
          </p>
          <Link to="/spoznajte/o-manuka-medu" className="link-underline mt-8">
            Preberite več
          </Link>
        </Reveal>
      </div>
    </section>
  );
}
