import { Link, NavLink, useParams } from 'react-router-dom';
import { useContent } from '@/context/StoreContext';
import NotFoundPage from '@/pages/NotFoundPage';

export default function PolicyPage() {
  const { slug } = useParams();
  const policies = useContent('policies').items;
  const policy = policies.find((p) => p.slug === slug);
  if (!policy) return <NotFoundPage />;

  return (
    <section className="container-x grid gap-12 py-20 sm:py-24 lg:grid-cols-12">
      <aside className="lg:col-span-3">
        <p className="eyebrow mb-6">Pravna obvestila</p>
        <nav className="flex flex-wrap gap-2 lg:flex-col lg:gap-0">
          {policies.map((p) => (
            <NavLink
              key={p.slug}
              to={`/pravno/${p.slug}`}
              className={({ isActive }) =>
                `border px-4 py-2 text-sm transition-colors lg:border-0 lg:border-l-2 lg:py-3 ${
                  isActive ? 'border-gold-500 text-navy-900' : 'border-navy-100 text-navy-800/60 hover:text-navy-900'
                }`
              }
            >
              {p.title}
            </NavLink>
          ))}
        </nav>
      </aside>
      <article className="lg:col-span-8 lg:col-start-5">
        <p className="text-xs uppercase tracking-[0.2em] text-navy-800/50">
          <Link to="/" className="hover:text-gold-600">Domov</Link> / {policy.title}
        </p>
        <h1 className="heading-lg mt-6">{policy.title}</h1>
        <div className="mt-12 space-y-10">
          {policy.sections.map((s) => (
            <div key={s.heading}>
              <h2 className="text-base font-medium text-navy-900">{s.heading}</h2>
              <p className="mt-3 text-sm leading-[1.8] text-navy-800/75">{s.text}</p>
            </div>
          ))}
        </div>
      </article>
    </section>
  );
}
