import { Eye, EyeOff, KeyRound, LogOut, Mail, Package, User as UserIcon } from 'lucide-react';
import { useEffect, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import BrandBall from '@/components/ui/BrandBall';
import { formatDateTime, formatEur } from '@/data/orders';
import { OrderStatusBadge } from '@/components/admin/StatusBadge';
import { supabase } from '@/lib/supabase';

type Mode = 'prijava' | 'registracija';

interface Profile {
  first_name: string;
  last_name: string;
  phone: string;
  address: string;
  address2: string;
  postal_code: string;
  city: string;
  country: string;
  newsletter: boolean;
}

interface CustomerOrder {
  id: string;
  order_number: string;
  status: string;
  total: string;
  created_at: string;
}

export default function AccountPage() {
  const [session, setSession] = useState<{ user: { id: string; email: string } } | null>(null);
  const [mode, setMode] = useState<Mode>('prijava');
  const [showPassword, setShowPassword] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');

  // Auth form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');

  // Dashboard state
  const [profile, setProfile] = useState<Profile | null>(null);
  const [orders, setOrders] = useState<CustomerOrder[]>([]);
  const [tab, setTab] = useState<'orders' | 'profile' | 'password'>('orders');
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session as typeof session);
    });
    const { data } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s as typeof session);
    });
    return () => data.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session) return;
    supabase.from('profiles').select('*').eq('id', session.user.id).maybeSingle().then(({ data }) => {
      if (data) setProfile(data as Profile);
      else setProfile({ first_name: '', last_name: '', phone: '', address: '', address2: '', postal_code: '', city: '', country: 'Slovenija', newsletter: false });
    });
    (async () => {
      await supabase.rpc('link_my_orders');
      const { data } = await supabase
        .from('orders')
        .select('id, order_number, status, total, created_at')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false });
      setOrders((data ?? []) as CustomerOrder[]);
    })();
  }, [session]);

  const handleAuth = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setNotice('');
    try {
      if (mode === 'prijava') {
        const { error: err } = await supabase.auth.signInWithPassword({ email, password });
        if (err) throw err;
      } else {
        const { data, error: err } = await supabase.auth.signUp({ email, password, options: { data: { first_name: firstName, last_name: lastName } } });
        if (err) throw err;
        if (data.user && !data.session) {
          setNotice('Račun je ustvarjen. Prosimo, prijavite se.');
          setMode('prijava');
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Napaka pri prijavi.');
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setProfile(null);
    setOrders([]);
  };

  const handleSaveProfile = async (e: FormEvent) => {
    e.preventDefault();
    if (!session || !profile) return;
    setSaving(true);
    setSaveMsg('');
    const { error: err } = await supabase.from('profiles').upsert({ id: session.user.id, ...profile });
    setSaving(false);
    if (err) { setError('Profila ni bilo mogoče shraniti.'); return; }
    setSaveMsg('Podatki so shranjeni.');
  };

  const handleChangePassword = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const newPassword = String(form.get('new_password') ?? '');
    const confirm = String(form.get('confirm_password') ?? '');
    if (newPassword.length < 8) { setError('Geslo mora imeti vsaj 8 znakov.'); return; }
    if (newPassword !== confirm) { setError('Gesli se ne ujemata.'); return; }
    setSaving(true);
    setSaveMsg('');
    setError('');
    const { error: err } = await supabase.auth.updateUser({ password: newPassword });
    setSaving(false);
    if (err) { setError('Gesla ni bilo mogoče spremeniti.'); return; }
    setSaveMsg('Geslo je spremenjeno.');
    (e.target as HTMLFormElement).reset();
  };

  if (!session) {
    return (
      <section className="grid min-h-[80vh] lg:grid-cols-2">
        <div className="relative hidden overflow-hidden bg-ink-950 lg:block">
          <BrandBall className="absolute -right-24 top-16 h-[28rem] w-[28rem]" />
          <div className="absolute inset-0 flex items-end p-16">
            <p className="max-w-sm font-display text-5xl font-bold leading-tight tracking-tight text-white">Vaša naročila in podatki na enem mestu.</p>
          </div>
        </div>
        <div className="flex items-center justify-center px-6 py-20">
          <div className="w-full max-w-md">
            <div className="grid grid-cols-2 border-b border-ink-100">
              {(['prijava', 'registracija'] as Mode[]).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => { setMode(m); setError(''); setNotice(''); }}
                  className={`pb-4 text-xs font-medium uppercase tracking-[0.2em] transition-colors ${mode === m ? 'border-b-2 border-ink-900 text-ink-900' : 'text-ink-800/40 hover:text-ink-900'}`}
                >
                  {m === 'prijava' ? 'Prijava' : 'Registracija'}
                </button>
              ))}
            </div>
            <h1 className="heading-lg mt-12">{mode === 'prijava' ? 'Dobrodošli nazaj' : 'Ustvarite račun'}</h1>
            <p className="mt-3 text-sm text-ink-800/70">
              {mode === 'prijava' ? 'Prijavite se za pregled naročil in podatkov.' : 'Spremljajte naročila, shranite naslove in prejmite ekskluzivne ponudbe.'}
            </p>
            <form key={mode} onSubmit={handleAuth} className="mt-10 animate-fade-in space-y-4">
              {mode === 'registracija' && (
                <div className="grid grid-cols-2 gap-4">
                  <input required placeholder="Ime" value={firstName} onChange={(e) => setFirstName(e.target.value)} className="input" autoComplete="given-name" />
                  <input required placeholder="Priimek" value={lastName} onChange={(e) => setLastName(e.target.value)} className="input" autoComplete="family-name" />
                </div>
              )}
              <input required type="email" placeholder="E-poštni naslov" value={email} onChange={(e) => setEmail(e.target.value)} className="input" autoComplete="email" />
              <div className="relative">
                <input required minLength={8} type={showPassword ? 'text' : 'password'} placeholder="Geslo" value={password} onChange={(e) => setPassword(e.target.value)} className="input pr-12" autoComplete={mode === 'prijava' ? 'current-password' : 'new-password'} />
                <button type="button" onClick={() => setShowPassword((v) => !v)} aria-label={showPassword ? 'Skrij geslo' : 'Prikaži geslo'} className="absolute right-4 top-1/2 -translate-y-1/2 text-ink-400 hover:text-ink-900">
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {mode === 'prijava' ? (
                <div className="text-right">
                  <button type="button" onClick={async () => {
                    if (!email) { setError('Vnesite e-poštni naslov za ponastavitev gesla.'); return; }
                    const { error: err } = await supabase.auth.resetPasswordForEmail(email);
                    setError(err ? 'Napaka pri pošiljanju.' : 'Povezava za ponastavitev gesla je poslana.');
                  }} className="text-xs text-brand-700 underline">Ste pozabili geslo?</button>
                </div>
              ) : (
                <label className="flex items-start gap-3 text-sm text-ink-800">
                  <input type="checkbox" className="mt-0.5 h-4 w-4 accent-ink-900" /> Želim prejemati e-novice in posebne ponudbe
                </label>
              )}
              <button type="submit" className="btn-primary w-full">{mode === 'prijava' ? 'Prijava' : 'Ustvari račun'}</button>
              {error && <p className="bg-red-50 p-4 text-center text-sm text-red-700">{error}</p>}
              {notice && <p className="animate-fade-in bg-brand-50 p-4 text-center text-sm text-brand-800">{notice}</p>}
            </form>
          </div>
        </div>
      </section>
    );
  }

  // Dashboard
  return (
    <section className="min-h-[80vh] bg-mist-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="heading-lg">Moj račun</h1>
            <p className="mt-1 flex items-center gap-1 text-sm text-ink-800/60">
              <Mail className="h-3.5 w-3.5" /> {session.user.email}
            </p>
          </div>
          <button type="button" onClick={handleSignOut} className="btn-secondary flex items-center gap-2">
            <LogOut className="h-4 w-4" /> Odjava
          </button>
        </div>

        <div className="mb-6 flex gap-1 border-b border-ink-100">
          {([
            { id: 'orders' as const, label: 'Moja naročila', Icon: Package },
            { id: 'profile' as const, label: 'Podatki', Icon: UserIcon },
            { id: 'password' as const, label: 'Spremeni geslo', Icon: KeyRound },
          ]).map(({ id, label, Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-colors ${tab === id ? 'border-ink-900 text-ink-900' : 'border-transparent text-ink-800/50 hover:text-ink-900'}`}
            >
              <Icon className="h-4 w-4" /> {label}
            </button>
          ))}
        </div>

        {tab === 'orders' && (
          <div className="animate-fade-in">
            {orders.length === 0 ? (
              <div className="rounded-xl border border-ink-100 bg-white p-12 text-center">
                <Package className="mx-auto h-10 w-10 text-ink-300" />
                <p className="mt-4 text-sm text-ink-800/60">Še nimate naročil.</p>
                <Link to="/trgovina" className="btn-primary mt-6">Začnite nakupovati</Link>
              </div>
            ) : (
              <div className="overflow-hidden rounded-xl border border-ink-100 bg-white">
                <table className="w-full text-sm">
                  <thead className="border-b border-ink-100 bg-ink-50/50 text-left text-xs uppercase tracking-wider text-ink-800/60">
                    <tr>
                      <th className="px-4 py-3 font-medium">Naročilo</th>
                      <th className="px-4 py-3 font-medium">Datum</th>
                      <th className="px-4 py-3 font-medium">Status</th>
                      <th className="px-4 py-3 text-right font-medium">Znesek</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-ink-50">
                    {orders.map((o) => (
                      <tr key={o.id} className="transition-colors hover:bg-ink-50/40">
                        <td className="px-4 py-3 font-medium text-ink-900">{o.order_number}</td>
                        <td className="px-4 py-3 text-xs text-ink-800/50">{formatDateTime(o.created_at)}</td>
                        <td className="px-4 py-3"><OrderStatusBadge status={o.status as never} /></td>
                        <td className="px-4 py-3 text-right font-medium text-ink-900">{formatEur(Number(o.total))}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {tab === 'profile' && profile && (
          <form onSubmit={handleSaveProfile} className="animate-fade-in space-y-4 rounded-xl border border-ink-100 bg-white p-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="text-xs font-medium uppercase tracking-wider text-ink-800/50">Ime</span>
                <input value={profile.first_name} onChange={(e) => setProfile((p) => ({ ...p!, first_name: e.target.value }))} className="input mt-1" />
              </label>
              <label className="block">
                <span className="text-xs font-medium uppercase tracking-wider text-ink-800/50">Priimek</span>
                <input value={profile.last_name} onChange={(e) => setProfile((p) => ({ ...p!, last_name: e.target.value }))} className="input mt-1" />
              </label>
            </div>
            <label className="block">
              <span className="text-xs font-medium uppercase tracking-wider text-ink-800/50">Telefon</span>
              <input value={profile.phone} onChange={(e) => setProfile((p) => ({ ...p!, phone: e.target.value }))} className="input mt-1" />
            </label>
            <label className="block">
              <span className="text-xs font-medium uppercase tracking-wider text-ink-800/50">Naslov</span>
              <input value={profile.address} onChange={(e) => setProfile((p) => ({ ...p!, address: e.target.value }))} className="input mt-1" />
            </label>
            <label className="block">
              <span className="text-xs font-medium uppercase tracking-wider text-ink-800/50">Naslov 2</span>
              <input value={profile.address2} onChange={(e) => setProfile((p) => ({ ...p!, address2: e.target.value }))} className="input mt-1" />
            </label>
            <div className="grid gap-4 sm:grid-cols-3">
              <label className="block">
                <span className="text-xs font-medium uppercase tracking-wider text-ink-800/50">Poštna številka</span>
                <input value={profile.postal_code} onChange={(e) => setProfile((p) => ({ ...p!, postal_code: e.target.value }))} className="input mt-1" />
              </label>
              <label className="block">
                <span className="text-xs font-medium uppercase tracking-wider text-ink-800/50">Kraj</span>
                <input value={profile.city} onChange={(e) => setProfile((p) => ({ ...p!, city: e.target.value }))} className="input mt-1" />
              </label>
              <label className="block">
                <span className="text-xs font-medium uppercase tracking-wider text-ink-800/50">Država</span>
                <input value={profile.country} onChange={(e) => setProfile((p) => ({ ...p!, country: e.target.value }))} className="input mt-1" />
              </label>
            </div>
            <label className="flex items-center gap-3 text-sm text-ink-800">
              <input type="checkbox" checked={profile.newsletter} onChange={(e) => setProfile((p) => ({ ...p!, newsletter: e.target.checked }))} className="h-4 w-4 accent-ink-900" />
              Želim prejemati e-novice in posebne ponudbe
            </label>
            {error && <p className="text-sm text-red-600">{error}</p>}
            {saveMsg && <p className="text-sm text-emerald-700">{saveMsg}</p>}
            <button type="submit" disabled={saving} className="btn-primary">{saving ? 'Shranjevanje ...' : 'Shrani podatke'}</button>
          </form>
        )}

        {tab === 'password' && (
          <form onSubmit={handleChangePassword} className="animate-fade-in space-y-4 rounded-xl border border-ink-100 bg-white p-6">
            <label className="block">
              <span className="text-xs font-medium uppercase tracking-wider text-ink-800/50">Novo geslo</span>
              <input name="new_password" type="password" required minLength={8} className="input mt-1" autoComplete="new-password" />
            </label>
            <label className="block">
              <span className="text-xs font-medium uppercase tracking-wider text-ink-800/50">Potrdi geslo</span>
              <input name="confirm_password" type="password" required minLength={8} className="input mt-1" autoComplete="new-password" />
            </label>
            {error && <p className="text-sm text-red-600">{error}</p>}
            {saveMsg && <p className="text-sm text-emerald-700">{saveMsg}</p>}
            <button type="submit" disabled={saving} className="btn-primary">{saving ? 'Spreminjanje ...' : 'Spremeni geslo'}</button>
          </form>
        )}
      </div>
    </section>
  );
}
