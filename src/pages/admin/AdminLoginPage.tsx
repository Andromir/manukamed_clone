import { ArrowRight, Lock, ShieldCheck } from 'lucide-react';
import { useEffect, useState, type FormEvent } from 'react';
import { Navigate } from 'react-router-dom';
import { LoadingBlock, Notice, Spinner } from '@/components/admin/ui';
import Logo from '@/components/ui/Logo';
import { useAdminAuth } from '@/context/AdminAuthContext';
import { images } from '@/data/images';
import { supabase } from '@/lib/supabase';

export default function AdminLoginPage() {
  const { session, isAdmin, loading, signIn, createFirstAdmin } = useAdminAuth();
  const [hasAdmin, setHasAdmin] = useState<boolean | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    supabase.rpc('admin_exists').then(({ data, error: rpcError }) => {
      setHasAdmin(rpcError ? true : data === true);
    });
  }, []);

  if (loading || hasAdmin === null) return <LoadingBlock />;
  if (session && isAdmin) return <Navigate to="/admin" replace />;

  const setup = !hasAdmin;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    if (setup) {
      if (password.length < 8) return setError('Geslo mora imeti vsaj 8 znakov.');
      if (password !== confirm) return setError('Gesli se ne ujemata.');
    }
    setBusy(true);
    const message = setup ? await createFirstAdmin(email.trim(), password) : await signIn(email.trim(), password);
    setBusy(false);
    if (message) setError(message);
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="relative hidden overflow-hidden bg-navy-950 lg:block">
        <img src={images.honeySpoonsDark} alt="" className="absolute inset-0 h-full w-full object-cover opacity-40" />
        <div className="absolute inset-0 bg-gradient-to-t from-navy-950 via-navy-950/70 to-navy-950/30" />
        <div className="relative flex h-full flex-col justify-between p-12">
          <Logo light />
          <div className="max-w-md">
            <p className="text-xs uppercase tracking-[0.25em] text-gold-300">Skrbniška plošča</p>
            <h1 className="mt-4 font-serif text-4xl italic leading-tight text-white">Upravljajte svojo trgovino na enem mestu.</h1>
            <p className="mt-4 text-sm leading-relaxed text-navy-100/70">
              Izdelki, naročila, plačila, vsebina strani in analitika prodaje.
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-center bg-cream-50 px-6 py-16">
        <div className="w-full max-w-sm animate-fade-up">
          <div className="mb-10 lg:hidden">
            <Logo />
          </div>
          <div className="mb-6 flex h-11 w-11 items-center justify-center rounded-full bg-navy-900 text-gold-300">
            {setup ? <ShieldCheck className="h-5 w-5" /> : <Lock className="h-5 w-5" />}
          </div>
          <h2 className="text-2xl font-medium tracking-tight text-navy-900">{setup ? 'Ustvarite skrbniški račun' : 'Prijava za skrbnike'}</h2>
          <p className="mt-2 text-sm text-navy-800/60">
            {setup
              ? 'Trgovina še nima skrbnika. Prvi ustvarjeni račun dobi polne pravice.'
              : 'Vnesite podatke svojega skrbniškega računa.'}
          </p>

          <form onSubmit={submit} className="mt-8 space-y-4">
            {error && <Notice tone="error">{error}</Notice>}
            <label className="block">
              <span className="admin-label">E-poštni naslov</span>
              <input type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className="admin-input" />
            </label>
            <label className="block">
              <span className="admin-label">Geslo</span>
              <input
                type="password"
                required
                autoComplete={setup ? 'new-password' : 'current-password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="admin-input"
              />
            </label>
            {setup && (
              <label className="block">
                <span className="admin-label">Ponovite geslo</span>
                <input type="password" required autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} className="admin-input" />
              </label>
            )}
            <button type="submit" disabled={busy} className="admin-btn w-full justify-center py-3">
              {busy ? <Spinner /> : <ArrowRight className="h-4 w-4" />}
              {setup ? 'Ustvari račun' : 'Prijava'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
