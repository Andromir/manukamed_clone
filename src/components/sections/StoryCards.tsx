import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import Reveal from '@/components/ui/Reveal';
import type { Story } from '@/data/stories';

export default function StoryCards({ items }: { items: Story[] }) {
  const cols = items.length >= 3 ? 'md:grid-cols-3' : 'md:grid-cols-2';
  return (
    <div className={`grid gap-10 ${cols}`}>
      {items.map((story, i) => (
        <Reveal key={story.slug} delay={i * 120}>
          <Link to={`/spoznajte/${story.slug}`} className="group block">
            <div className="aspect-[4/3] overflow-hidden bg-cream-100">
              <img
                src={story.card}
                alt={story.title}
                loading="lazy"
                className="h-full w-full object-cover transition-transform duration-[1.2s] ease-out group-hover:scale-105"
              />
            </div>
            <p className="eyebrow mt-6">{story.eyebrow}</p>
            <h3 className="mt-3 text-lg font-normal uppercase tracking-[0.12em] text-navy-900 transition-colors group-hover:text-gold-600">
              {story.title}
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-navy-800/70">{story.lead}</p>
            <span className="mt-5 inline-flex items-center gap-2 text-xs font-medium uppercase tracking-[0.2em] text-navy-900">
              Preberi več <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
            </span>
          </Link>
        </Reveal>
      ))}
    </div>
  );
}
