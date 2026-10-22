import { Info } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import BestSellerCarousel from '@/components/home/BestSellerCarousel';
import PageHero from '@/components/sections/PageHero';
import StoryCards from '@/components/sections/StoryCards';
import Reveal from '@/components/ui/Reveal';
import { useContent, useStore } from '@/context/StoreContext';
import NotFoundPage from '@/pages/NotFoundPage';

export default function StoryPage() {
  const { slug } = useParams();
  const { bestSellers } = useStore();
  const stories = useContent('stories').items;
  const story = stories.find((s) => s.slug === slug);
  if (!story) return <NotFoundPage />;

  const others = stories.filter((s) => s.slug !== story.slug).slice(0, 3);

  return (
    <>
      <PageHero image={story.hero} eyebrow={story.eyebrow} title={story.title} lead={story.lead} />

      <article className="container-x py-20 sm:py-28">
        <div className="mx-auto max-w-3xl">
          <p className="mb-12 text-xs uppercase tracking-[0.2em] text-navy-800/50">
            <Link to="/" className="hover:text-gold-600">Domov</Link> / <Link to="/spoznajte" className="hover:text-gold-600">Spoznajte</Link> / {story.title}
          </p>
          {story.sections.map((section, i) => (
            <Reveal key={i} className="prose-story mb-14">
              {section.heading && <h2 className="heading-lg mb-8">{section.heading}</h2>}
              {section.paragraphs.map((p, j) => (
                <p key={j} className={i === 0 && j === 0 ? '!text-lg !text-navy-900' : ''}>
                  {p}
                </p>
              ))}
              {section.list && (
                <dl className="grid gap-px overflow-hidden border border-navy-100 bg-navy-100 sm:grid-cols-2">
                  {section.list.map((item) => (
                    <div key={item.term} className="bg-white p-6">
                      <dt className="text-sm font-medium uppercase tracking-[0.12em] text-gold-700">{item.term}</dt>
                      <dd className="mt-3 text-sm leading-relaxed text-navy-800/75">{item.text}</dd>
                    </div>
                  ))}
                </dl>
              )}
              {section.table && (
                <figure className="mt-8 overflow-hidden border border-navy-100">
                  <figcaption className="bg-navy-900 px-6 py-4 text-xs font-medium uppercase tracking-[0.18em] text-white">{section.table.caption}</figcaption>
                  <table className="w-full text-left text-sm">
                    <thead className="bg-cream-100 text-xs uppercase tracking-[0.14em] text-navy-800">
                      <tr>
                        {section.table.head.map((h) => (
                          <th key={h} className="px-6 py-3 font-medium">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-navy-100">
                      {section.table.rows.map((row) => (
                        <tr key={row[0]}>
                          {row.map((cell, k) => (
                            <td key={k} className={`px-6 py-4 ${k === 0 ? 'text-navy-900' : 'font-medium text-gold-700'}`}>
                              {cell}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </figure>
              )}
              {section.note && (
                <aside className="mt-8 flex gap-4 border-l-2 border-gold-500 bg-cream-50 p-6 text-xs leading-relaxed text-navy-800/70">
                  <Info className="h-4 w-4 shrink-0 text-gold-600" />
                  {section.note}
                </aside>
              )}
            </Reveal>
          ))}
        </div>
      </article>

      <section className="bg-cream-100 py-20">
        <div className="container-x mb-10 flex items-end justify-between">
          <h2 className="heading-lg">Izberite svoj manuka med</h2>
          <Link to="/trgovina" className="link-underline hidden sm:inline-block">
            Vsi izdelki
          </Link>
        </div>
        <BestSellerCarousel items={bestSellers} />
      </section>

      <section className="container-x py-24">
        <h2 className="heading-lg mb-14 text-center">Preberite tudi</h2>
        <StoryCards items={others} />
      </section>
    </>
  );
}
