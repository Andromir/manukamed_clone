export default function BrandBall({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" aria-hidden="true" className={className}>
      <circle cx="32" cy="32" r="30" fill="#A01000" />
      <circle cx="29.5" cy="30" r="27.5" fill="#F02000" />
      <circle cx="22" cy="19.5" r="9.5" fill="#F8D2D0" />
    </svg>
  );
}
