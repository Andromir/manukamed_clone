import { ArrowLeft, ArrowUp, ExternalLink, Plus, Trash2, X } from 'lucide-react';
import { useEffect, useState, type ChangeEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Card, Field, ImageInput, LoadingBlock, Notice, PageHeader, Spinner, Toggle } from '@/components/admin/ui';
import { useStore } from '@/context/StoreContext';
import { categories, type ProductRow } from '@/data/products';
import { supabase } from '@/lib/supabase';

type Draft = Omit<ProductRow, 'id' | 'images' | 'variants' | 'nutrition' | 'sale_price' | 'rating' | 'mgo'> & {
  images: string[];
  variants: { size: string; price: string }[];
  nutrition: { label: string; value: string }[];
  sale_price: string;
  rating: string;
  mgo: string;
};

const emptyDraft: Draft = {
  slug: '',
  name: '',
  category: 'manuka-med',
  mgo: '',
  badge: '',
  short: '',
  description: '',
  images: [],
  variants: [{ size: '250 g', price: '' }],
  sale_price: '',
  stock: 0,
  rating: '5',
  reviews: 0,
  how_to_use: '',
  taste: '',
  ingredients: '',
  allergy: '',
  nutrition: [],
  is_published: false,
  is_bestseller: false,
  sort_order: 0,
};

const slugify = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

function toDraft(r: ProductRow): Draft {
  const fields = Object.fromEntries(Object.keys(emptyDraft).map((k) => [k, r[k as keyof ProductRow]]));
  return {
    ...emptyDraft,
    ...fields,
    short: r.short ?? '',
    description: r.description ?? '',
    how_to_use: r.how_to_use ?? '',
    taste: r.taste ?? '',
    ingredients: r.ingredients ?? '',
    allergy: r.allergy ?? '',
    badge: r.badge ?? '',
    mgo: r.mgo === null ? '' : String(r.mgo),
    images: Array.isArray(r.images) ? r.images : [],
    variants: (Array.isArray(r.variants) && r.variants.length ? r.variants : [{ size: '', price: 0 }]).map((v) => ({ size: v.size, price: String(v.price) })),
    nutrition: Array.isArray(r.nutrition) ? r.nutrition : [],
    sale_price: r.sale_price === null ? '' : String(r.sale_price),
    rating: String(r.rating ?? 5),
  };
}

function validate(d: Draft): string | null {
  if (!d.name.trim()) return 'Vnesite ime izdelka.';
  if (!/^[a-z0-9-]+$/.test(d.slug)) return 'Spletni naslov lahko vsebuje le male črke, številke in vezaje.';
  if (d.variants.length === 0) return 'Dodajte vsaj eno velikost s ceno.';
  for (const v of d.variants) {
    if (!v.size.trim()) return 'Vsaka velikost potrebuje oznako (npr. 250 g).';
    if (!(Number(v.price) > 0)) return 'Vsaka velikost potrebuje veljavno ceno.';
  }
  if (d.sale_price && !(Number(d.sale_price) > 0)) return 'Akcijska cena ni veljavna.';
  if (d.stock < 0) return 'Zaloga ne more biti negativna.';
  return null;
}

export default function AdminProductEditPage() {
  const { id } = useParams();
  const isNew = id === 'nov';
  const navigate = useNavigate();
  const { reload } = useStore();
  const [draft, setDraft] = useState<Draft | null>(isNew ? emptyDraft : null);
  const [slugTouched, setSlugTouched] = useState(!isNew);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (isNew) return;
    supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .maybeSingle()
      .then(({ data, error: err }) => {
        if (err || !data) setError('Izdelka ni bilo mogoče najti.');
        else setDraft(toDraft(data as ProductRow));
      });
  }, [id, isNew]);

  if (!draft) return error ? <Notice tone="error">{error}</Notice> : <LoadingBlock />;

  const set = <K extends keyof Draft>(key: K, value: Draft[K]) => {
    setSaved(false);
    setDraft((d) => {
      if (!d) return d;
      const next = { ...d, [key]: value };
      if (key === 'name' && !slugTouched) next.slug = slugify(String(value));
      return next;
    });
  };
  const text = (key: keyof Draft) => (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => set(key, e.target.value as never);

  const save = async () => {
    const problem = validate(draft);
    if (problem) return setError(problem);
    setError('');
    setSaving(true);
    const payload = {
      ...draft,
      name: draft.name.trim(),
      badge: draft.badge?.trim() || null,
      mgo: draft.mgo === '' ? null : Number(draft.mgo),
      sale_price: draft.sale_price === '' ? null : Number(draft.sale_price),
      rating: Number(draft.rating) || 5,
      variants: draft.variants.map((v) => ({ size: v.size.trim(), price: Number(v.price) })),
      nutrition: draft.nutrition.filter((n) => n.label.trim()),
      images: draft.images.filter(Boolean),
    };
    const res = isNew
      ? await supabase.from('products').insert(payload).select('id').maybeSingle()
      : await supabase.from('products').update(payload).eq('id', id).select('id').maybeSingle();
    setSaving(false);
    if (res.error) {
      setError(res.error.code === '23505' ? 'Izdelek s tem spletnim naslovom že obstaja.' : 'Shranjevanje ni uspelo. Poskusite znova.');
      return;
    }
    reload();
    setSaved(true);
    if (isNew && res.data) navigate(`/admin/izdelki/${res.data.id}`, { replace: true });
  };

  const remove = async () => {
    setSaving(true);
    const { error: err } = await supabase.from('products').delete().eq('id', id);
    setSaving(false);
    if (err) return setError('Brisanje ni uspelo.');
    reload();
    navigate('/admin/izdelki', { replace: true });
  };

  const moveImage = (i: number) => {
    const imgs = [...draft.images];
    [imgs[i - 1], imgs[i]] = [imgs[i], imgs[i - 1]];
    set('images', imgs);
  };

  return (
    <div className="animate-fade-in pb-24">
      <Link to="/admin/izdelki" className="mb-4 inline-flex items-center gap-1 text-sm text-navy-700 hover:text-navy-900">
        <ArrowLeft className="h-4 w-4" /> Vsi izdelki
      </Link>
      <PageHeader
        title={isNew ? 'Nov izdelek' : draft.name || 'Urejanje izdelka'}
        actions={
          !isNew && (
            <a href={`/izdelek/${draft.slug}`} target="_blank" rel="noreferrer" className="admin-btn-secondary">
              <ExternalLink className="h-4 w-4" /> Ogled v trgovini
            </a>
          )
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card title="Osnovni podatki">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Ime izdelka" className="sm:col-span-2">
                <input value={draft.name} onChange={text('name')} className="admin-input" />
              </Field>
              <Field label="Spletni naslov" hint={`manukamed.si/izdelek/${draft.slug || '...'}`} className="sm:col-span-2">
                <input
                  value={draft.slug}
                  onChange={(e) => {
                    setSlugTouched(true);
                    set('slug', slugify(e.target.value));
                  }}
                  className="admin-input"
                />
              </Field>
              <Field label="Kratek opis" hint="Prikazan na kartici izdelka in pod naslovom." className="sm:col-span-2">
                <textarea rows={2} value={draft.short} onChange={text('short')} className="admin-input" />
              </Field>
              <Field label="Opis" className="sm:col-span-2">
                <textarea rows={6} value={draft.description} onChange={text('description')} className="admin-input" />
              </Field>
            </div>
          </Card>

          <Card title="Slike" description="Prva slika je glavna. Priporočamo kvadratne slike, vsaj 1000 px.">
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              {draft.images.map((src, i) => (
                <div key={`${src}-${i}`} className="relative">
                  <ImageInput
                    compact
                    value={src}
                    folder="products"
                    onChange={(url) => set('images', draft.images.map((x, j) => (j === i ? url : x)))}
                    onRemove={() => set('images', draft.images.filter((_, j) => j !== i))}
                  />
                  {i === 0 && <span className="absolute left-2 top-2 rounded bg-navy-900 px-1.5 py-0.5 text-[10px] font-medium text-white">Glavna</span>}
                  {i > 0 && (
                    <button type="button" onClick={() => moveImage(i)} aria-label="Premakni naprej" className="absolute left-2 top-2 rounded bg-white/90 p-1 text-navy-800 shadow hover:bg-white">
                      <ArrowUp className="h-3 w-3 -rotate-90" />
                    </button>
                  )}
                </div>
              ))}
              <ImageInput compact value="" folder="products" onChange={(url) => set('images', [...draft.images, url])} />
            </div>
          </Card>

          <Card title="Cene in velikosti">
            <div className="space-y-3">
              {draft.variants.map((v, i) => (
                <div key={i} className="flex items-end gap-3">
                  <Field label={i === 0 ? 'Velikost' : ''} className="flex-1">
                    <input
                      value={v.size}
                      onChange={(e) => set('variants', draft.variants.map((x, j) => (j === i ? { ...x, size: e.target.value } : x)))}
                      placeholder="npr. 250 g"
                      className="admin-input"
                    />
                  </Field>
                  <Field label={i === 0 ? 'Cena (EUR)' : ''} className="w-36">
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={v.price}
                      onChange={(e) => set('variants', draft.variants.map((x, j) => (j === i ? { ...x, price: e.target.value } : x)))}
                      className="admin-input"
                    />
                  </Field>
                  <button
                    type="button"
                    disabled={draft.variants.length === 1}
                    onClick={() => set('variants', draft.variants.filter((_, j) => j !== i))}
                    aria-label="Odstrani velikost"
                    className="mb-0.5 rounded-lg p-2.5 text-navy-300 hover:bg-red-50 hover:text-red-600 disabled:opacity-30"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
              <button type="button" onClick={() => set('variants', [...draft.variants, { size: '', price: '' }])} className="admin-btn-secondary">
                <Plus className="h-4 w-4" /> Dodaj velikost
              </button>
            </div>
            <div className="mt-6 grid gap-4 border-t border-navy-50 pt-6 sm:grid-cols-2">
              <Field label="Akcijska cena (EUR)" hint="Pustite prazno, če izdelek ni v akciji.">
                <input type="number" step="0.01" min="0" value={draft.sale_price} onChange={text('sale_price')} className="admin-input" />
              </Field>
              <Field label="Zaloga (kosov)">
                <input type="number" min="0" value={draft.stock} onChange={(e) => set('stock', Math.max(0, Number(e.target.value) || 0))} className="admin-input" />
              </Field>
            </div>
          </Card>

          <Card title="Podrobnosti" description="Prikazano v zavihkih na strani izdelka. Prazna polja se ne prikažejo.">
            <div className="grid gap-4">
              <Field label="Uporaba">
                <textarea rows={3} value={draft.how_to_use} onChange={text('how_to_use')} className="admin-input" />
              </Field>
              <Field label="Okus">
                <textarea rows={2} value={draft.taste} onChange={text('taste')} className="admin-input" />
              </Field>
              <Field label="Sestavine">
                <textarea rows={2} value={draft.ingredients} onChange={text('ingredients')} className="admin-input" />
              </Field>
              <Field label="Alergeni in opozorila">
                <textarea rows={2} value={draft.allergy} onChange={text('allergy')} className="admin-input" />
              </Field>
            </div>
            <div className="mt-6 border-t border-navy-50 pt-6">
              <p className="admin-label">Hranilne vrednosti</p>
              <div className="space-y-2">
                {draft.nutrition.map((n, i) => (
                  <div key={i} className="flex gap-2">
                    <input
                      value={n.label}
                      placeholder="npr. Energija"
                      onChange={(e) => set('nutrition', draft.nutrition.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)))}
                      className="admin-input flex-1"
                    />
                    <input
                      value={n.value}
                      placeholder="npr. 1380 kJ"
                      onChange={(e) => set('nutrition', draft.nutrition.map((x, j) => (j === i ? { ...x, value: e.target.value } : x)))}
                      className="admin-input w-40"
                    />
                    <button type="button" onClick={() => set('nutrition', draft.nutrition.filter((_, j) => j !== i))} aria-label="Odstrani vrstico" className="rounded-lg p-2.5 text-navy-300 hover:bg-red-50 hover:text-red-600">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
                <button type="button" onClick={() => set('nutrition', [...draft.nutrition, { label: '', value: '' }])} className="admin-btn-secondary">
                  <Plus className="h-4 w-4" /> Dodaj vrstico
                </button>
              </div>
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card title="Objava">
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-navy-900">Objavljeno</p>
                  <p className="text-xs text-navy-800/50">Vidno kupcem v trgovini.</p>
                </div>
                <Toggle checked={draft.is_published} onChange={(v) => set('is_published', v)} label="Objavljeno" />
              </div>
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-navy-900">Najbolje prodajano</p>
                  <p className="text-xs text-navy-800/50">Prikazano na domači strani.</p>
                </div>
                <Toggle checked={draft.is_bestseller} onChange={(v) => set('is_bestseller', v)} label="Najbolje prodajano" />
              </div>
            </div>
          </Card>

          <Card title="Razvrstitev">
            <div className="grid gap-4">
              <Field label="Kategorija">
                <select value={draft.category} onChange={text('category')} className="admin-input">
                  {categories.map((c) => (
                    <option key={c.slug} value={c.slug}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="MGO vrednost" hint="Samo za manuka med, npr. 400.">
                <input type="number" min="0" value={draft.mgo} onChange={text('mgo')} className="admin-input" />
              </Field>
              <Field label="Značka" hint="Kratka oznaka na sliki, npr. Novo.">
                <input value={draft.badge ?? ''} onChange={text('badge')} className="admin-input" />
              </Field>
              <Field label="Vrstni red" hint="Manjša številka pomeni višje na seznamu.">
                <input type="number" value={draft.sort_order} onChange={(e) => set('sort_order', Number(e.target.value) || 0)} className="admin-input" />
              </Field>
            </div>
          </Card>

          <Card title="Ocene">
            <div className="grid grid-cols-2 gap-4">
              <Field label="Ocena (1-5)">
                <input type="number" min="1" max="5" step="0.1" value={draft.rating} onChange={text('rating')} className="admin-input" />
              </Field>
              <Field label="Št. mnenj">
                <input type="number" min="0" value={draft.reviews} onChange={(e) => set('reviews', Math.max(0, Number(e.target.value) || 0))} className="admin-input" />
              </Field>
            </div>
          </Card>

          {!isNew && (
            <Card title="Brisanje">
              {confirmDelete ? (
                <div className="space-y-3">
                  <p className="text-sm text-navy-800">Izdelek bo trajno izbrisan. Pretekla naročila ostanejo nespremenjena.</p>
                  <div className="flex gap-2">
                    <button type="button" onClick={remove} disabled={saving} className="admin-btn-danger">
                      Da, izbriši
                    </button>
                    <button type="button" onClick={() => setConfirmDelete(false)} className="admin-btn-secondary">
                      Prekliči
                    </button>
                  </div>
                </div>
              ) : (
                <button type="button" onClick={() => setConfirmDelete(true)} className="admin-btn-danger">
                  <Trash2 className="h-4 w-4" /> Izbriši izdelek
                </button>
              )}
            </Card>
          )}
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-navy-100 bg-white/95 backdrop-blur lg:left-64">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-8 lg:px-10">
          <div className="min-w-0 text-sm">
            {error ? <span className="text-red-600">{error}</span> : saved ? <span className="text-emerald-700">Spremembe so shranjene.</span> : null}
          </div>
          <button type="button" onClick={save} disabled={saving} className="admin-btn shrink-0">
            {saving && <Spinner />} {isNew ? 'Ustvari izdelek' : 'Shrani'}
          </button>
        </div>
      </div>
    </div>
  );
}
