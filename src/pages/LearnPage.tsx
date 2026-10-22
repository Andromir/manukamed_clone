import FaqSection from '@/components/sections/FaqSection';
import PageHero from '@/components/sections/PageHero';
import StoryCards from '@/components/sections/StoryCards';
import { useContent } from '@/context/StoreContext';

export default function LearnPage() {
  const images = useContent('images');
  const stories = useContent('stories').items;
  return (
    <>
      <PageHero
        image={images.nzCoast}
        eyebrow="Spoznajte"
        title="Svet manuka medu"
        lead="Od neokrnjene divjine Nove Zelandije do znanosti, ki stoji za vsakim kozarcem."
      />
      <section className="container-x py-24">
        <StoryCards items={stories.slice(0, 2)} />
        <div className="mt-20">
          <StoryCards items={stories.slice(2)} />
        </div>
      </section>
      <FaqSection />
    </>
  );
}
