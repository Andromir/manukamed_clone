import { AlertCircle, ChevronDown, CreditCard, HelpCircle, Landmark, Loader2, ShoppingBag, UserCheck, Wallet } from 'lucide-react';
import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import OrderSummary from '@/components/checkout/OrderSummary';
import Logo from '@/components/ui/Logo';
import { useCart } from '@/context/CartContext';
import { useStore } from '@/context/StoreContext';
import { PAYMENT_METHOD_IDS, type PaymentMethodId } from '@/data/settings';
import { formatPrice } from '@/lib/format';
import { callFunction, supabase } from '@/lib/supabase';

const paymentIcons: Record<PaymentMethodId, typeof CreditCard> = {
  stripe: CreditCard,
  paypal: Wallet,
  bank: Landmark,
  cod: ShoppingBag,
};

const paymentHints: Record<PaymentMethodId, string> = {
  stripe: 'Po oddaji naročila boste preusmerjeni na varno plačilno stran, kjer vnesete podatke kartice.',
  paypal: 'Po oddaji naročila boste preusmerjeni na PayPal.',
  bank: 'Podatke za plačilo (UPN) prikažemo po oddaji naročila. Naročilo odpošljemo po prejemu plačila.',
  cod: 'Plačilo z gotovino ali kartico ob prevzemu paketa.',
};

interface SavedAddress {
  first_name: string;
  last_name: string;
  phone: string;
  address: string;
  address2: string;
  postal_code: string;
  city: string;
  country: string;
}

interface CreateOrderResponse {
  order_number: string;
  token: string;
  total: number;
  redirect_url?: string;
}

function Section({ title, children, aside }: { title: string; children: ReactNode; aside?: ReactNode }) {
  return (
    <section className="mt-10">
      <div className="mb-4 flex items-baseline justify-between">
        <h2 className="text-xl font-normal text-ink-900">{title}</h2>
        {aside}
      </div>
      {children}
    </section>
  );
}

export default function CheckoutPage() {
  const cart = useCart();
  const { settings, loading } = useStore();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const shippingMethods = settings.shipping_methods.filter((m) => m.enabled);
  const paymentMethods = useMemo(
    () => PAYMENT_METHOD_IDS.filter((id) => settings.payment_methods[id]?.enabled).map((id) => ({ id, ...settings.payment_methods[id] })),
    [settings.payment_methods],
  );
  const [shippingId, setShippingId] = useState<string | null>(null);
  const [paymentId, setPaymentId] = useState<PaymentMethodId | null>(null);
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const cancelled = params.get('preklicano') === '1';
  const [account, setAccount] = useState<{ id: string; email: string } | null>(null);
  const [saved, setSaved] = useState<Partial<SavedAddress> | null>(null);
  const [saveAddress, setSaveAddress] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      const { data } = await supabase.auth.getSession();
      const user = data.session?.user;
      if (!active || !user?.email) return;
      setAccount({ id: user.id, email: user.email });
      const { data: profile } = await supabase
        .from('profiles')
        .select('first_name, last_name, phone, address, address2, postal_code, city, country')
        .eq('id', user.id)
        .maybeSingle();
      if (active) setSaved((profile as SavedAddress | null) ?? {});
    })();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!paymentId || !paymentMethods.some((m) => m.id === paymentId)) setPaymentId(paymentMethods[0]?.id ?? null);
  }, [paymentMethods, paymentId]);

  const method = shippingMethods.find((m) => m.id === shippingId);
  const payment = paymentMethods.find((m) => m.id === paymentId);
  const freeShipping = cart.subtotal >= settings.free_shipping_threshold;
  const shippingPrice = method ? (freeShipping ? 0 : method.price) : null;
  const paymentFee = payment?.fee ?? 0;
  const total = cart.subtotal - cart.discount + (shippingPrice ?? 0) + paymentFee;

  if (cart.lines.length === 0) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-mist-50 px-6 text-center">
        <Logo />
        <h1 className="heading-lg mt-12">Vaša košarica je prazna</h1>
        <p className="mt-4 text-sm text-ink-800/70">Za nadaljevanje na blagajno dodajte izdelke v košarico.</p>
        <Link to="/trgovina" className="btn-primary mt-8">
          V trgovino
        </Link>
      </div>
    );
  }

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (submitting) return;
    if (!shippingId) {
      setError('Prosimo, izberite način dostave.');
      return;
    }
    if (!paymentId) {
      setError('Trenutno ni na voljo nobenega načina plačila. Prosimo, kontaktirajte nas.');
      return;
    }
    const f = new FormData(e.currentTarget);
    const get = (k: string) => String(f.get(k) ?? '').trim();
    setSubmitting(true);
    setError('');
    const address: SavedAddress = {
      first_name: get('first_name'),
      last_name: get('last_name'),
      phone: get('phone'),
      address: get('address'),
      address2: get('address2'),
      postal_code: get('postal_code'),
      city: get('city'),
      country: get('country'),
    };
    try {
      const { data: auth } = await supabase.auth.getSession();
      if (account && !auth.session) {
        setAccount(null);
        throw new Error('Vaša prijava je potekla. Prijavite se znova ali nadaljujte kot gost.');
      }
      const res = await callFunction<CreateOrderResponse>('create-order', {
        customer: { email: account?.email ?? get('email'), ...address },
        items: cart.lines.map((l) => ({ slug: l.slug, size: l.size, qty: l.qty, subscribe: l.subscribe })),
        discount_code: cart.discountCode ?? '',
        shipping_method: shippingId,
        payment_method: paymentId,
        newsletter: f.get('newsletter') === 'on',
        origin: window.location.origin,
      }, auth.session?.access_token);
      if (!res.order_number || !res.token) throw new Error('Naročila ni bilo mogoče oddati. Poskusite znova.');
      if (account && saveAddress) {
        await supabase.from('profiles').upsert({ id: account.id, ...address, updated_at: new Date().toISOString() });
      }
      if (res.redirect_url) {
        window.location.assign(res.redirect_url);
        return;
      }
      cart.clear();
      navigate(`/hvala?o=${encodeURIComponent(res.order_number)}&t=${encodeURIComponent(res.token)}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Naročila ni bilo mogoče oddati.');
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white lg:bg-[linear-gradient(to_right,#ffffff_50%,#f8f5ee_50%)]">
      <div className="mx-auto grid max-w-6xl lg:grid-cols-2">
        <div className="px-5 py-8 sm:px-10 lg:border-r lg:border-ink-100 lg:py-12 lg:pr-14">
          <div className="flex items-center justify-between">
            <Logo />
            <Link to="/trgovina" aria-label="Nazaj v trgovino" className="text-brand-600 hover:text-ink-900">
              <ShoppingBag className="h-5 w-5" strokeWidth={1.5} />
            </Link>
          </div>

          <button
            type="button"
            onClick={() => setSummaryOpen((v) => !v)}
            className="mt-8 flex w-full items-center justify-between border-y border-ink-100 bg-mist-50 px-4 py-4 text-sm text-brand-700 lg:hidden"
          >
            <span className="flex items-center gap-2">
              {summaryOpen ? 'Skrij' : 'Prikaži'} povzetek naročila <ChevronDown className={`h-4 w-4 transition-transform ${summaryOpen ? 'rotate-180' : ''}`} />
            </span>
            <span className="font-medium text-ink-900">{formatPrice(total)}</span>
          </button>
          {summaryOpen && (
            <div className="animate-fade-in bg-mist-50 px-4 py-6 lg:hidden">
              <OrderSummary shipping={shippingPrice} paymentFee={paymentFee} paymentFeeLabel={payment ? `Strošek: ${payment.label}` : undefined} />
            </div>
          )}

          {cancelled && (
            <div className="mt-8 flex items-start gap-3 border border-brand-300 bg-brand-50 p-4 text-sm text-ink-900">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-brand-700" />
              Plačilo je bilo preklicano. Izdelki so še vedno v vaši košarici – izberete lahko drug način plačila.
            </div>
          )}

          <form onSubmit={onSubmit}>
            <Section
              title="Kontakt"
              aside={
                <Link to="/prijava" className="text-sm text-brand-600 underline">
                  {account ? 'Moj račun' : 'Prijava'}
                </Link>
              }
            >
              {account ? (
                <div className="animate-fade-in flex items-start gap-3 border border-ink-100 bg-mist-50 p-4">
                  <UserCheck className="mt-0.5 h-5 w-5 shrink-0 text-brand-600" strokeWidth={1.5} />
                  <div className="min-w-0 text-sm">
                    <p className="text-ink-800/70">Prijavljeni kot</p>
                    <p className="truncate font-medium text-ink-900">{account.email}</p>
                    <p className="mt-1 text-xs text-ink-800/60">Naročilo bo shranjeno v vaš račun.</p>
                  </div>
                </div>
              ) : (
                <input name="email" type="email" required placeholder="E-poštni naslov" className="input" autoComplete="email" />
              )}
              <label className="mt-3 flex items-center gap-2 text-sm text-ink-800">
                <input name="newsletter" type="checkbox" className="h-4 w-4 accent-ink-900" /> Pošljite mi novice in posebne ponudbe
              </label>
            </Section>

            <Section title="Dostava">
              <div key={saved ? 'saved' : 'empty'} className="grid gap-3 sm:grid-cols-2">
                <label className="relative sm:col-span-2">
                  <span className="absolute left-4 top-2 text-[11px] text-ink-800/50">Država</span>
                  <select
                    name="country"
                    className="input appearance-none pb-2 pt-6"
                    defaultValue={saved?.country && settings.countries.includes(saved.country) ? saved.country : 'Slovenija'}
                  >
                    {settings.countries.map((c) => (
                      <option key={c}>{c}</option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-700" />
                </label>
                <input name="first_name" required placeholder="Ime" className="input" autoComplete="given-name" defaultValue={saved?.first_name ?? ''} />
                <input name="last_name" required placeholder="Priimek" className="input" autoComplete="family-name" defaultValue={saved?.last_name ?? ''} />
                <input name="address" required placeholder="Naslov (ulica in hišna številka)" className="input sm:col-span-2" autoComplete="street-address" defaultValue={saved?.address ?? ''} />
                <input name="address2" placeholder="Podjetje, stanovanje ipd. (neobvezno)" className="input sm:col-span-2" defaultValue={saved?.address2 ?? ''} />
                <input name="postal_code" required placeholder="Poštna številka" className="input" inputMode="numeric" autoComplete="postal-code" defaultValue={saved?.postal_code ?? ''} />
                <input name="city" required placeholder="Kraj" className="input" autoComplete="address-level2" defaultValue={saved?.city ?? ''} />
                <div className="relative sm:col-span-2">
                  <input name="phone" required type="tel" placeholder="Telefon" className="input pr-10" autoComplete="tel" defaultValue={saved?.phone ?? ''} />
                  <HelpCircle className="absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-300" aria-label="Za obveščanje o dostavi" />
                </div>
              </div>
              {account && (
                <label className="mt-3 flex items-center gap-2 text-sm text-ink-800">
                  <input type="checkbox" checked={saveAddress} onChange={(e) => setSaveAddress(e.target.checked)} className="h-4 w-4 accent-ink-900" />
                  Shrani te podatke v moj profil za naslednji nakup
                </label>
              )}
            </Section>

            <Section title="Način dostave">
              <div className="divide-y divide-ink-100 border border-ink-100">
                {shippingMethods.map((m) => (
                  <label
                    key={m.id}
                    className={`flex cursor-pointer items-center gap-4 px-4 py-4 transition-colors ${shippingId === m.id ? 'bg-ink-50' : 'hover:bg-mist-50'}`}
                  >
                    <input
                      type="radio"
                      name="shipping"
                      checked={shippingId === m.id}
                      onChange={() => {
                        setShippingId(m.id);
                        setError('');
                      }}
                      className="h-4 w-4 accent-ink-900"
                    />
                    <span className="flex-1">
                      <span className="block text-sm text-ink-900">{m.label}</span>
                      <span className="text-xs text-ink-800/60">{m.eta}</span>
                    </span>
                    <span className="text-sm font-normal text-ink-900">{m.price === 0 || freeShipping ? 'Brezplačno' : formatPrice(m.price)}</span>
                  </label>
                ))}
              </div>
            </Section>

            <Section title="Plačilo">
              <p className="-mt-2 mb-4 text-sm text-ink-800/60">Vse transakcije so varne in šifrirane.</p>
              <div className="divide-y divide-ink-100 border border-ink-100">
                {paymentMethods.length === 0 && (
                  <p className="p-4 text-sm text-ink-800/70">{loading ? 'Nalaganje načinov plačila …' : 'Trenutno ni na voljo nobenega načina plačila.'}</p>
                )}
                {paymentMethods.map(({ id, label, fee, description }) => {
                  const Icon = paymentIcons[id];
                  return (
                    <div key={id}>
                      <label className={`flex cursor-pointer items-center gap-4 px-4 py-4 transition-colors ${paymentId === id ? 'bg-ink-50' : 'hover:bg-mist-50'}`}>
                        <input type="radio" name="payment" checked={paymentId === id} onChange={() => setPaymentId(id)} className="h-4 w-4 accent-ink-900" />
                        <span className="flex-1 text-sm text-ink-900">
                          {label}
                          {fee > 0 && <span className="text-ink-800/60"> (+{formatPrice(fee)})</span>}
                        </span>
                        <Icon className="h-5 w-5 text-ink-400" strokeWidth={1.5} />
                      </label>
                      {paymentId === id && (
                        <p className="animate-fade-in bg-mist-50 p-4 text-sm text-ink-800/70">{description || paymentHints[id]}</p>
                      )}
                    </div>
                  );
                })}
              </div>
            </Section>

            <label className="mt-8 flex items-start gap-3 text-sm text-ink-800">
              <input type="checkbox" required className="mt-0.5 h-4 w-4 accent-ink-900" />
              <span>
                Strinjam se s{' '}
                <Link to="/pravno/pogoji-poslovanja" className="text-brand-700 underline">
                  splošnimi pogoji poslovanja
                </Link>{' '}
                in{' '}
                <Link to="/pravno/zasebnost" className="text-brand-700 underline">
                  politiko zasebnosti
                </Link>
                .
              </span>
            </label>

            {error && (
              <p role="alert" className="mt-6 flex items-start gap-2 border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> {error}
              </p>
            )}

            <button type="submit" disabled={submitting} className="btn-primary mt-8 flex w-full items-center justify-center gap-2 py-5 text-sm disabled:cursor-wait disabled:opacity-70">
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Oddajanje naročila …
                </>
              ) : (
                <>Oddaj naročilo · {formatPrice(total)}</>
              )}
            </button>
          </form>

          <nav className="mt-12 flex flex-wrap gap-x-5 gap-y-2 border-t border-ink-100 pt-6 text-xs">
            {[
              ['/pravno/vracila', 'Vračila'],
              ['/pravno/dostava', 'Dostava'],
              ['/pravno/zasebnost', 'Zasebnost'],
              ['/pravno/pogoji-poslovanja', 'Pogoji poslovanja'],
              ['/kontakt', 'Kontakt'],
            ].map(([to, label]) => (
              <Link key={to} to={to} className="text-brand-700 underline hover:text-ink-900">
                {label}
              </Link>
            ))}
          </nav>
        </div>

        <aside className="hidden bg-mist-100 px-10 py-12 lg:block lg:bg-transparent lg:pl-14">
          <div className="sticky top-12">
            <OrderSummary shipping={shippingPrice} paymentFee={paymentFee} paymentFeeLabel={payment ? `Strošek: ${payment.label}` : undefined} />
          </div>
        </aside>
      </div>
    </div>
  );
}
