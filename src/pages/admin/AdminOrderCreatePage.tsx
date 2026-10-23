import { ArrowLeft, Plus, Search, Trash2, UserCheck } from 'lucide-react';
import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card, Field, LoadingBlock, Notice, PageHeader, Spinner } from '@/components/admin/ui';
import { useAdminAuth } from '@/context/AdminAuthContext';
import { useStore } from '@/context/StoreContext';
import { PAYMENT_METHOD_IDS, type PaymentMethodId } from '@/data/settings';
import { PAYMENT_METHOD_LABELS, PAYMENT_STATUSES, ORDER_STATUSES, formatEur } from '@/data/orders';
import { mapProduct, type Product, type ProductVariant } from '@/data/products';
import { callFunction, supabase } from '@/lib/supabase';

interface Customer {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
}

interface DraftItem {
  slug: string;
  name: string;
  size: string;
  qty: number;
  unitPrice: number;
  image: string;
  productId: string;
  stock: number;
}

export default function AdminOrderCreatePage() {
  const { session } = useAdminAuth();
  const { settings, loading } = useStore();
  const navigate = useNavigate();

  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState('');
  const [selectedSlug, setSelectedSlug] = useState('');
  const [selectedSize, setSelectedSize] = useState('');
  const [items, setItems] = useState<DraftItem[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [customerId, setCustomerId] = useState('');

  const [form, setForm] = useState({
    email: '', first_name: '', last_name: '', phone: '', address: '', address2: '', postal_code: '', city: '', country: 'Slovenija',
    shipping_method: '', payment_method: '', payment_status: 'unpaid', order_status: 'new', discount_code: '', admin_note: '',
  });

  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const shippingMethods = useMemo(() => settings.shipping_methods.filter((m) => m.enabled), [settings]);
  const paymentMethods = useMemo(
    () => PAYMENT_METHOD_IDS.filter((id) => settings.payment_methods[id]?.enabled).map((id) => ({ id, ...settings.payment_methods[id] })),
    [settings.payment_methods],
  );

  useEffect(() => {
    if (!form.shipping_method && shippingMethods[0]) setForm((f) => ({ ...f, shipping_method: shippingMethods[0].id }));
  }, [shippingMethods]);
  useEffect(() => {
    if (!form.payment_method && paymentMethods[0]) setForm((f) => ({ ...f, payment_method: paymentMethods[0].id }));
  }, [paymentMethods]);

  useEffect(() => {
    supabase.from('products').select('*').order('name').then(({ data, error: err }) => {
      if (err) return setError('Izdelkov ni bilo mogoče naložiti.');
      setProducts((data ?? []).map(mapProduct));
    });
  }, []);

  useEffect(() => {
    if (!session) return;
    callFunction<{ users: Customer[] }>('admin-manage', { action: 'list_users' }, session.access_token)
      .then((res) => setCustomers(Array.isArray(res.users) ? res.users : []))
      .catch(() => setError('Seznama strank ni bilo mogoče naložiti.'));
  }, [session]);

  const selectCustomer = async (id: string) => {
    setCustomerId(id);
    const customer = customers.find((c) => c.id === id);
    if (!customer) return;
    const { data } = await supabase
      .from('profiles')
      .select('first_name, last_name, phone, address, address2, postal_code, city, country')
      .eq('id', id)
      .maybeSingle();
    setForm((f) => ({
      ...f,
      email: customer.email,
      first_name: data?.first_name || customer.first_name || f.first_name,
      last_name: data?.last_name || customer.last_name || f.last_name,
      phone: data?.phone || f.phone,
      address: data?.address || f.address,
      address2: data?.address2 || f.address2,
      postal_code: data?.postal_code || f.postal_code,
      city: data?.city || f.city,
      country: data?.country && settings.countries.includes(data.country) ? data.country : f.country,
    }));
  };

  const inCart = (slug: string) => items.filter((i) => i.slug === slug).reduce((s, i) => s + i.qty, 0);

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()) || p.slug.toLowerCase().includes(search.toLowerCase()),
  );

  const selectedProduct = products.find((p) => p.slug === selectedSlug);

  const addItem = () => {
    if (!selectedProduct) return;
    const variant = selectedProduct.variants.find((v) => v.size === selectedSize) ?? selectedProduct.variants[0];
    if (!variant) return;
    if (inCart(selectedProduct.slug) >= selectedProduct.stock) {
      return setError(`Izdelka "${selectedProduct.name}" ni več na zalogi.`);
    }
    setError('');
    setItems((prev) => {
      const existing = prev.find((i) => i.slug === selectedProduct.slug && i.size === variant.size);
      if (existing) return prev.map((i) => (i === existing ? { ...i, qty: i.qty + 1 } : i));
      return [...prev, {
        slug: selectedProduct.slug, name: selectedProduct.name, size: variant.size, qty: 1,
        unitPrice: selectedProduct.salePrice ?? variant.price, image: selectedProduct.images[0] ?? '',
        productId: selectedProduct.id, stock: selectedProduct.stock,
      }];
    });
    setSelectedSlug('');
    setSelectedSize('');
  };

  const removeItem = (idx: number) => setItems((prev) => prev.filter((_, i) => i !== idx));
  const updateQty = (idx: number, qty: number) => {
    if (!Number.isFinite(qty) || qty < 1) return;
    setItems((prev) => {
      const target = prev[idx];
      const others = prev.reduce((s, it, i) => (i !== idx && it.slug === target.slug ? s + it.qty : s), 0);
      const max = Math.max(1, Math.min(99, target.stock - others));
      return prev.map((it, i) => (i === idx ? { ...it, qty: Math.min(qty, max) } : it));
    });
  };

  const subtotal = items.reduce((s, i) => s + i.unitPrice * i.qty, 0);
  const shippingMethod = shippingMethods.find((m) => m.id === form.shipping_method);
  const paymentFee = paymentMethods.find((m) => m.id === form.payment_method)?.fee ?? 0;
  const freeShipping = subtotal >= settings.free_shipping_threshold;
  const shippingCost = shippingMethod ? (freeShipping ? 0 : shippingMethod.price) : 0;
  const total = subtotal + shippingCost + paymentFee;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (items.length === 0) return setError('Dodajte vsaj en izdelek.');
    const over = items.find((i) => inCart(i.slug) > i.stock);
    if (over) return setError(`Izdelka "${over.name}" ni dovolj na zalogi (na voljo: ${over.stock}).`);
    if (!form.shipping_method) return setError('Izberite način dostave.');
    if (!form.payment_method) return setError('Izberite način plačila.');
    setSubmitting(true);
    setError('');
    try {
      const res = await callFunction<{ order_id: string; order_number: string }>('admin-create-order', {
        customer: {
          email: form.email, first_name: form.first_name, last_name: form.last_name, phone: form.phone,
          address: form.address, address2: form.address2, postal_code: form.postal_code, city: form.city, country: form.country,
        },
        items: items.map((i) => ({ slug: i.slug, size: i.size, qty: i.qty, subscribe: false })),
        discount_code: form.discount_code,
        shipping_method: form.shipping_method,
        payment_method: form.payment_method,
        payment_status: form.payment_status,
        order_status: form.order_status,
        admin_note: form.admin_note,
        newsletter: false,
        user_id: customerId || undefined,
      }, session?.access_token);
      navigate(`/admin/narocila/${res.order_id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Napaka pri ustvarjanju naročila.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingBlock />;

  return (
    <div className="animate-fade-in">
      <Link to="/admin/narocila" className="mb-4 inline-flex items-center gap-1 text-sm text-ink-700 hover:text-ink-900">
        <ArrowLeft className="h-4 w-4" /> Nazaj na naročila
      </Link>
      <PageHeader title="Ustvari naročilo" description="Ročno ustvari naročilo za stranko." />

      {error && <div className="mb-4"><Notice tone="error">{error}</Notice></div>}

      <form onSubmit={handleSubmit} className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card title="Izdelki">
            <div className="mb-4 flex flex-col gap-3 sm:flex-row">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-300" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Iskanje izdelkov"
                  className="admin-input pl-9"
                />
              </div>
              {selectedProduct && (
                <select value={selectedSize} onChange={(e) => setSelectedSize(e.target.value)} className="admin-input sm:w-40">
                  {selectedProduct.variants.map((v: ProductVariant) => (
                    <option key={v.size} value={v.size}>{v.size || 'standard'}</option>
                  ))}
                </select>
              )}
            </div>
            <div className="max-h-48 overflow-y-auto rounded-lg border border-ink-100">
              {filteredProducts.length === 0 && <p className="p-4 text-center text-sm text-ink-800/50">Ni najdenih izdelkov.</p>}
              {filteredProducts.map((p) => {
                const available = p.stock - inCart(p.slug);
                return (
                <button
                  key={p.id}
                  type="button"
                  disabled={available <= 0}
                  onClick={() => { setSelectedSlug(p.slug); setSelectedSize(p.variants[0]?.size ?? ''); }}
                  className={`flex w-full items-center gap-3 border-b border-ink-50 px-4 py-3 text-left transition-colors enabled:hover:bg-ink-50/50 disabled:cursor-not-allowed disabled:opacity-50 ${selectedSlug === p.slug ? 'bg-ink-50' : ''}`}
                >
                  <span className="h-10 w-10 shrink-0 overflow-hidden rounded bg-mist-100">
                    {p.images[0] && <img src={p.images[0]} alt="" className="h-full w-full object-cover" />}
                  </span>
                  <span className="flex-1">
                    <span className="block text-sm font-medium text-ink-900">{p.name}</span>
                    <span className="block text-xs text-ink-800/50">{p.variants.map((v) => `${v.size || 'std'} ${formatEur(v.price)}`).join(' · ')}</span>
                  </span>
                  <span
                    className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
                      p.stock <= 0 ? 'bg-red-50 text-red-700' : available <= 0 ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700'
                    }`}
                  >
                    {p.stock <= 0 ? 'Ni na zalogi' : available <= 0 ? 'Vse v naročilu' : `Zaloga: ${available}`}
                  </span>
                </button>
                );
              })}
            </div>
            <button type="button" onClick={addItem} disabled={!selectedProduct} className="admin-btn mt-3">
              <Plus className="h-4 w-4" /> Dodaj izdelek
            </button>

            {items.length > 0 && (
              <ul className="mt-4 divide-y divide-ink-50">
                {items.map((it, idx) => (
                  <li key={idx} className="flex items-center gap-3 py-3">
                    <span className="h-10 w-10 shrink-0 overflow-hidden rounded bg-mist-100">
                      {it.image && <img src={it.image} alt="" className="h-full w-full object-cover" />}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-ink-900">{it.name}</p>
                      <p className="text-xs text-ink-800/50">{it.size || 'standard'} · {formatEur(it.unitPrice)}</p>
                    </div>
                    <input
                      type="number" min={1} max={Math.min(99, it.stock)} value={it.qty}
                      onChange={(e) => updateQty(idx, Number(e.target.value))}
                      className="admin-input w-16 text-center"
                    />
                    <span className="w-20 text-right text-sm font-medium text-ink-900">{formatEur(it.unitPrice * it.qty)}</span>
                    <button type="button" onClick={() => removeItem(idx)} className="rounded-lg p-2 text-red-500 hover:bg-red-50">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card title="Podatki o stranki">
            <Field label="Stranka" hint="Izberite registriranega kupca, da se naročilo poveže z njegovim računom." className="mb-4">
              <select value={customerId} onChange={(e) => selectCustomer(e.target.value)} className="admin-input">
                <option value="">Gost (brez računa)</option>
                {customers.map((c) => {
                  const name = [c.first_name, c.last_name].filter(Boolean).join(' ');
                  return <option key={c.id} value={c.id}>{name ? `${name} – ${c.email}` : c.email}</option>;
                })}
              </select>
            </Field>
            {customerId && (
              <p className="animate-fade-in mb-4 flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-xs text-emerald-800">
                <UserCheck className="h-4 w-4" /> Naročilo bo povezano z računom stranke. E-pošta je zaklenjena na e-pošto računa.
              </p>
            )}
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Ime">
                <input required value={form.first_name} onChange={(e) => setForm((f) => ({ ...f, first_name: e.target.value }))} className="admin-input" />
              </Field>
              <Field label="Priimek">
                <input required value={form.last_name} onChange={(e) => setForm((f) => ({ ...f, last_name: e.target.value }))} className="admin-input" />
              </Field>
              <Field label="E-pošta" className="sm:col-span-2">
                <input type="email" required readOnly={!!customerId} value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} className={`admin-input ${customerId ? 'bg-ink-50/60 text-ink-800/70' : ''}`} />
              </Field>
              <Field label="Telefon">
                <input required value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} className="admin-input" />
              </Field>
              <Field label="Država">
                <select value={form.country} onChange={(e) => setForm((f) => ({ ...f, country: e.target.value }))} className="admin-input">
                  {settings.countries.map((c) => <option key={c}>{c}</option>)}
                </select>
              </Field>
              <Field label="Naslov" className="sm:col-span-2">
                <input required value={form.address} onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))} className="admin-input" />
              </Field>
              <Field label="Naslov 2" className="sm:col-span-2">
                <input value={form.address2} onChange={(e) => setForm((f) => ({ ...f, address2: e.target.value }))} className="admin-input" />
              </Field>
              <Field label="Poštna številka">
                <input required value={form.postal_code} onChange={(e) => setForm((f) => ({ ...f, postal_code: e.target.value }))} className="admin-input" />
              </Field>
              <Field label="Kraj">
                <input required value={form.city} onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))} className="admin-input" />
              </Field>
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card title="Povzetek">
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between text-ink-800/70">
                <dt>Vmesni seštevek</dt>
                <dd>{formatEur(subtotal)}</dd>
              </div>
              <div className="flex justify-between text-ink-800/70">
                <dt>Dostava</dt>
                <dd>{shippingCost === 0 ? 'Brezplačno' : formatEur(shippingCost)}</dd>
              </div>
              {paymentFee > 0 && (
                <div className="flex justify-between text-ink-800/70">
                  <dt>Strošek plačila</dt>
                  <dd>{formatEur(paymentFee)}</dd>
                </div>
              )}
              <div className="flex justify-between border-t border-ink-100 pt-2 text-base font-medium text-ink-900">
                <dt>Skupaj</dt>
                <dd>{formatEur(total)}</dd>
              </div>
            </dl>
          </Card>

          <Card title="Dostava in plačilo">
            <div className="space-y-4">
              <Field label="Način dostave">
                <select value={form.shipping_method} onChange={(e) => setForm((f) => ({ ...f, shipping_method: e.target.value }))} className="admin-input">
                  {shippingMethods.map((m) => <option key={m.id} value={m.id}>{m.label} ({m.price === 0 ? 'brezplačno' : formatEur(m.price)})</option>)}
                </select>
              </Field>
              <Field label="Način plačila">
                <select value={form.payment_method} onChange={(e) => setForm((f) => ({ ...f, payment_method: e.target.value as PaymentMethodId }))} className="admin-input">
                  {paymentMethods.map((m) => <option key={m.id} value={m.id}>{PAYMENT_METHOD_LABELS[m.id] ?? m.label}</option>)}
                </select>
              </Field>
              <Field label="Status naročila">
                <select value={form.order_status} onChange={(e) => setForm((f) => ({ ...f, order_status: e.target.value }))} className="admin-input">
                  {ORDER_STATUSES.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
                </select>
              </Field>
              <Field label="Status plačila">
                <select value={form.payment_status} onChange={(e) => setForm((f) => ({ ...f, payment_status: e.target.value }))} className="admin-input">
                  {PAYMENT_STATUSES.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
                </select>
              </Field>
              <Field label="Koda za popust" hint="Neobvezno.">
                <input value={form.discount_code} onChange={(e) => setForm((f) => ({ ...f, discount_code: e.target.value }))} className="admin-input" />
              </Field>
              <Field label="Interna opomba" hint="Vidna samo skrbnikom.">
                <textarea rows={2} value={form.admin_note} onChange={(e) => setForm((f) => ({ ...f, admin_note: e.target.value }))} className="admin-input" />
              </Field>
            </div>
          </Card>

          <button type="submit" disabled={submitting} className="admin-btn w-full">
            {submitting && <Spinner />} Ustvari naročilo
          </button>
        </div>
      </form>
    </div>
  );
}
