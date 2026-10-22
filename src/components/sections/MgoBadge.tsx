export default function MgoBadge({ subtitle = 'Certificirana vsebnost MGO™' }: { subtitle?: string }) {
  return (
    <div className="text-center text-white">
      <div className="relative mx-auto flex h-28 w-28 items-center justify-center sm:h-36 sm:w-36">
        <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full" aria-hidden>
          <polygon points="50,3 93,27 93,73 50,97 7,73 7,27" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-gold-300" />
        </svg>
        <span className="text-3xl font-normal tracking-[0.12em] sm:text-4xl">MGO</span>
      </div>
      <p className="accent-serif mt-6 text-3xl sm:text-5xl">{subtitle}</p>
    </div>
  );
}
