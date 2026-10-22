export default function PageLoader({ label = 'Nalaganje …' }: { label?: string }) {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4" role="status" aria-live="polite">
      <span className="h-8 w-8 animate-spin rounded-full border-2 border-navy-100 border-t-gold-500" />
      <span className="text-xs uppercase tracking-[0.2em] text-navy-800/60">{label}</span>
    </div>
  );
}
