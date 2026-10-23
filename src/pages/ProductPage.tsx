import { CreditCard, RotateCcw, ShieldCheck, Truck } from 'lucide-react';
import { useParams } from 'react-router-dom';
import ProductGallery from '@/components/product/ProductGallery';
import PurchasePanel from '@/components/product/PurchasePanel';
import FaqSection from '@/components/sections/FaqSection';
import ProductCard from '@/components/shop/ProductCard';
import Reveal from '@/components/ui/Reveal';
import PageLoader from '@/components/ui/PageLoader';
import { useContent, useStore } from '@/context/StoreContext';
import { productDetailLabels } from '@/data/products';
import NotFoundPage from '@/pages/NotFoundPage';

const highlightIcons = [Truck, ShieldCheck, RotateCcw, CreditCard];

export default function ProductPage() {
  const { slug } = useParams();
  const { getProduct, products, loading } = useStore();
  const productText = useContent('product');
  const product = getProduct(slug);
  if (!product) return loading ? <PageLoader /> : <NotFoundPage />;

  const related = products.filter((p) => p.slug !== product.slug && p.category === product.category).slice(0, 4);
  const details = [
    { title: productDetailLabels.howToUse, text: product.howToUse },
    { title: productDetailLabels.taste, text: product.taste },
    { title: productDetailLabels.ingredients, text: product.ingredients },
    { title: productDetailLabels.allergy, text: product.allergy },
  ].filter((d) => d.text.trim());

  return (
    <>
      <section className="container-x grid gap-12 py-10 sm:py-14 lg:grid-cols-12 lg:gap-16">
        <div className="lg:col-span-7">
          <ProductGallery key={product.slug} product={product} />
          <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {productText.highlights.map(({ title, text }, i) => {
              const Icon = highlightIcons[i % highlightIcons.length];
              return (
                <div key={title} className="rounded-2xl bg-mist-100 p-5">
                  <Icon className="h-6 w-6 text-brand-600" strokeWidth={1.5} />
                  <p className="mt-4 text-sm font-semibold text-ink-950">{title}</p>
                  <p className="mt-1 text-xs text-ink-500">{text}</p>
                </div>
              );
            })}
          </div>
        </div>
        <div className="lg:col-span-5">
          <div className="lg:sticky lg:top-28">
            <PurchasePanel key={product.slug} product={product} />
          </div>
        </div>
      </section>

      {(details.length > 0 || product.nutrition) && (
        <section className="container-x grid gap-12 pb-20 pt-6 lg:grid-cols-2 lg:gap-16">
          {details.length > 0 && (
            <Reveal className="space-y-10">
              {details.map((d) => (
                <div key={d.title}>
                  <h2 className="heading-md">{d.title}</h2>
                  <p className="mt-3 text-sm leading-relaxed text-ink-700">{d.text}</p>
                </div>
              ))}
            </Reveal>
          )}
          {product.nutrition && (
            <Reveal className="rounded-3xl bg-ink-950 p-8 text-white sm:p-10">
              <h2 className="font-display text-2xl font-bold">{productDetailLabels.nutrition}</h2>
              <dl className="mt-6">
                {product.nutrition.map((row) => (
                  <div key={row.label} className="flex justify-between gap-6 border-b border-white/10 py-3 text-sm last:border-0">
                    <dt className="text-ink-300">{row.label}</dt>
                    <dd className="text-right font-medium">{row.value}</dd>
                  </div>
                ))}
              </dl>
            </Reveal>
          )}
        </section>
      )}

      {related.length > 0 && (
        <section className="container-x py-24">
          <h2 className="heading-lg mb-12">Podobni izdelki</h2>
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
