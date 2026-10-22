import { Award, BadgeCheck, FlaskConical, Hexagon, Leaf, ShieldCheck } from 'lucide-react';

const certs = [
  { Icon: Hexagon, label: 'MGO™ certificirano' },
  { Icon: FlaskConical, label: 'ISO 17025 laboratorij' },
  { Icon: ShieldCheck, label: 'UMFHA član' },
  { Icon: Leaf, label: '100 % Nova Zelandija' },
  { Icon: Award, label: 'Massey nagrada 2011' },
  { Icon: BadgeCheck, label: 'Sledljivo do panja' },
];

export default function CertificationStrip() {
  const loop = [...certs, ...certs];
  return (
    <section className="border-y border-navy-100 bg-cream-50 py-16">
      <p className="text-center">
        <span className="accent-serif text-2xl text-navy-900">Certifikati in priznanja</span>
      </p>
      <div className="relative mt-10 overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]">
        <div className="flex w-max animate-marquee gap-16 hover:[animation-play-state:paused]">
          {loop.map(({ Icon, label }, i) => (
            <div key={i} className="flex shrink-0 items-center gap-4 text-navy-800">
              <span className="flex h-14 w-14 items-center justify-center rounded-full border border-navy-200 bg-white">
                <Icon className="h-6 w-6 text-gold-600" strokeWidth={1.25} />
              </span>
              <span className="text-xs font-medium uppercase tracking-[0.18em]">{label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
