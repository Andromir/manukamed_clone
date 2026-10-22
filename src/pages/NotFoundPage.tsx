import { Hexagon } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <section className="container-x flex min-h-[60vh] flex-col items-center justify-center py-24 text-center">
      <Hexagon className="h-16 w-16 text-gold-500" strokeWidth={1} />
      <p className="eyebrow mt-8">Napaka 404</p>
      <h1 className="heading-lg mt-4">Strani ni mogoče najti</h1>
      <p className="mt-4 max-w-md text-sm text-navy-800/70">Stran, ki jo iščete, ne obstaja ali je bila premaknjena.</p>
      <div className="mt-10 flex flex-wrap justify-center gap-4">
        <Link to="/" className="btn-primary">
          Na domačo stran
        </Link>
        <Link to="/trgovina" className="btn-outline">
          V trgovino
        </Link>
      </div>
    </section>
  );
}
