import { Link } from 'react-router-dom';
import BestSellerCarousel from '@/components/home/BestSellerCarousel';
import CertificationStrip from '@/components/home/CertificationStrip';
import ComparisonPanel from '@/components/sections/ComparisonPanel';
import MgoBadge from '@/components/sections/MgoBadge';
import SplitFeature from '@/components/sections/SplitFeature';
import StoryCards from '@/components/sections/StoryCards';
import Accordion from '@/components/ui/Accordion';
import Reveal from '@/components/ui/Reveal';
import { useContent, useStore } from '@/context/StoreContext';

export default function HomePage() {
  const home = useContent('home');
  const stories = useContent('stories').items;
  const { bestSellers } = useStore();
  return (
    <>
      <section className="relative grid h-[92vh] min-h-[620px] grid-cols-1 overflow-hidden md:grid-cols-2">
        <div className="relative overflow-hidden">
          <img src={home.heroImageLeft} alt="" className="h-full w-full animate-slow-zoom object-cover" />
        </div>
        <div className="relative hidden overflow-hidden md:block">
          <img src={home.heroImageRight} alt="" className="h-full w-full animate-slow-zoom object-cover" />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-navy-950/70 via-navy-950/20 to-navy-950/30" />
        <div className="absolute inset-x-0 bottom-0 flex flex-col items-center px-6 pb-20 text-center text-white sm:pb-28">
          <p className="animate-fade-up text-xs font-medium uppercase tracking-widest2 text-gold-200" style={{ animationDelay: '0.2s' }}>
            {home.heroEyebrow}
          </p>
          <h1
            className="mt-6 animate-fade-up text-5xl font-normal uppercase leading-[1.05] tracking-[0.14em] sm:text-7xl lg:text-8xl"
            style={{ animationDelay: '0.35s' }}
          >
            {home.heroTitleLine1}
            <br />
            {home.heroTitleLine2}
          </h1>
          <p className="mt-6 animate-fade-up text-sm uppercase tracking-[0.25em] text-white/90 sm:text-base" style={{ animationDelay: '0.5s' }}>
            {home.heroSubtitle}
          </p>
          <Link to="/trgovina/manuka-med" className="btn-light mt-10 animate-fade-up" style={{ animationDelay: '0.65s' }}>
            {home.heroButton}
          </Link>
        </div>
      </section>

      <section className="container-x py-20 text-center sm:py-28">
        <Reveal>
          <p className="text-sm font-normal uppercase tracking-widest2 text-gold-600 sm:text-base">{home.introEyebrow}</p>
          <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-navy-800/75">
            {home.introText}
          </p>
        </Reveal>
      </section>

      <section className="pb-24">
        <div className="container-x mb-10 flex items-end justify-between">
          <h2 className="heading-lg">{home.bestsellersTitle}</h2>
          <Link to="/trgovina" className="link-underline hidden sm:inline-block">
            Vsi izdelki
          </Link>
        </div>
        <BestSellerCarousel items={bestSellers} />
      </section>

      <section className="grid bg-cream-100 lg:grid-cols-2">
        <div className="relative min-h-[420px] overflow-hidden lg:min-h-[680px]">
          <img src={home.reasonsImage} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover" />
        </div>
        <div className="flex items-center px-6 py-16 sm:px-16 lg:px-24">
          <Reveal className="w-full max-w-md">
            <p className="eyebrow">{home.reasonsEyebrow}</p>
            <h2 className="heading-lg mb-10 mt-4">{home.reasonsTitle}</h2>
            <Accordion items={home.reasons} />
          </Reveal>
        </div>
      </section>

      <SplitFeature
        reverse
        image={home.mgoImage}
        imageAlt={home.mgoTitle}
        eyebrow={home.mgoEyebrow}
        title={home.mgoTitle}
        link={{ to: '/spoznajte/vodilni-v-panogi', label: 'Več o metilglioksalu' }}
        overlay={<MgoBadge />}
      >
        {home.mgoParagraphs.map((t) => (
          <p key={t}>{t}</p>
        ))}
      </SplitFeature>

      <ComparisonPanel />

      <section className="container-x py-24 sm:py-32">
        <div className="mb-16 text-center">
          <p className="accent-serif text-2xl text-gold-600">{home.storiesEyebrow}</p>
          <div className="mx-auto mt-4 h-12 w-px bg-navy-200" />
          <h2 className="heading-lg mt-4">{home.storiesTitle}</h2>
        </div>
        <StoryCards items={stories.slice(1, 4)} />
      </section>

      <CertificationStrip />
    </>
  );
}
