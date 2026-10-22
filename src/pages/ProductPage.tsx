import { Hexagon, Leaf, Sparkles, Utensils } from 'lucide-react';
import { useParams } from 'react-router-dom';
import ProductGallery from '@/components/product/ProductGallery';
import PurchasePanel from '@/components/product/PurchasePanel';
import ComparisonPanel from '@/components/sections/ComparisonPanel';
import FaqSection from '@/components/sections/FaqSection';
import ProductCard from '@/components/shop/ProductCard';
import Reveal from '@/components/ui/Reveal';
import PageLoader from '@/components/ui/PageLoader';
import { useContent, useStore } from '@/context/StoreContext';
import NotFoundPage from '@/pages/NotFoundPage';

export default function ProductPage() {
  const { slug } = useParams();
  const { getProduct, products, loading } = useStore();
  const productText = useContent('product');
  const product = getProduct(slug);
  if (!product) return loading ? <PageLoader /> : <NotFoundPage />;

  const related = products.filter((p) => p.slug !== product.slug && p.category === product.category).slice(0, 4);
  const highlights = [
    { Icon: Hexagon, title: product.mgo ? `MGO™ ${product.mgo}+` : 'Čebelji izdelek', text: product.mgo ? 'Certificirana vsebnost' : 'Iz Nove Zelandije' },
    { Icon: Leaf, title: '100 % naravno', text: 'Brez dodatkov' },
    { Icon: Sparkles, title: 'Testirano', text: 'Laboratorij ISO 17025' },
    { Icon: Utensils, title: 'Vsakodnevno', text: 'Žlica na dan' },
  ];

  return (
    <>
      <section className="container-x grid gap-12 py-10 sm:py-14 lg:grid-cols-12 lg:gap-16">
        <div className="lg:col-span-7">
          <ProductGallery key={product.slug} product={product} />
          <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {highlights.map(({ Icon, title, text }) => (
              <div key={title} className="bg-navy-900 p-5 text-white">
                <Icon className="h-6 w-6 text-gold-400" strokeWidth={1.25} />
                <p className="mt-4 text-xs font-medium uppercase tracking-[0.14em]">{title}</p>
                <p className="mt-1 text-xs text-navy-100/70">{text}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="lg:col-span-5">
          <div className="lg:sticky lg:top-28">
            <PurchasePanel key={product.slug} product={product} />
          </div>
        </div>
      </section>

      <section className="mt-12 grid lg:grid-cols-2">
        <div className="relative min-h-[420px] overflow-hidden lg:min-h-[560px]">
          <img src={productText.lifestyleImage} alt="Uživanje manuka medu" loading="lazy" className="absolute inset-0 h-full w-full object-cover" />
        </div>
        <div className="flex items-center bg-white px-6 py-16 sm:px-16 lg:px-24">
          <Reveal className="max-w-md space-y-12">
            <div>
              <h2 className="heading-md">Način uporabe</h2>
              <p className="mt-4 text-sm leading-relaxed text-navy-800/75">{product.howToUse}</p>
            </div>
            <div>
              <h2 className="heading-md">Okus in aroma</h2>
              <p className="mt-4 text-sm leading-relaxed text-navy-800/75">{product.taste}</p>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="grid bg-navy-900 text-white lg:grid-cols-2">
        <div className="flex items-center justify-center px-6 py-16 sm:px-16">
          {product.nutrition ? (
            <div className="w-full max-w-sm border border-white/40 p-6">
              <p className="border-b-4 border-white/80 pb-2 text-2xl font-medium">Hranilna vrednost</p>
              <p className="mt-2 text-xs text-navy-100/70">na porcijo</p>
              <dl className="mt-3">
                {product.nutrition.map((row) => (
                  <div key={row.label} className="flex justify-between border-b border-white/20 py-2 text-sm">
                    <dt className="text-navy-100/90">{row.label}</dt>
                    <dd>{row.value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          ) : (
            <img src={product.images[1] ?? product.images[0]} alt={product.name} loading="lazy" className="aspect-square w-full max-w-sm object-cover" />
          )}
        </div>
        <div className="flex items-center border-t border-white/10 px-6 py-16 sm:px-16 lg:border-l lg:border-t-0 lg:px-24">
          <div className="max-w-md space-y-12">
            <div>
              <h2 className="text-lg font-normal uppercase tracking-[0.14em]">Sestavine</h2>
              <p className="mt-4 text-sm leading-relaxed text-navy-100/80">{product.ingredients}</p>
            </div>
            <div>
              <h2 className="text-lg font-normal uppercase tracking-[0.14em]">Opozorilo</h2>
              <p className="mt-4 text-sm leading-relaxed text-navy-100/80">{product.allergy}</p>
            </div>
            <div>
              <h2 className="text-lg font-normal uppercase tracking-[0.14em]">Shranjevanje</h2>
              <p className="mt-4 text-sm leading-relaxed text-navy-100/80">{productText.storageText}</p>
            </div>
          </div>
        </div>
      </section>

      {product.category === 'manuka-med' && <ComparisonPanel />}

      {related.length > 0 && (
        <section className="container-x py-24">
          <h2 className="heading-lg mb-12 text-center">Morda vam bo všeč</h2>
          <div className="grid grid-cols-1 gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-4">
            {related.map((p) => (
              <ProductCard key={p.slug} product={p} />
            ))}
          </div>
        </section>
      )}

      <FaqSection limit={5} />
    </>
  );
}
