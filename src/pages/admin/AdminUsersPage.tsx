import { Mail, Search, Shield, ShieldOff, UserPlus, KeyRound, Loader2 } from 'lucide-react';
import { useEffect, useState, type FormEvent } from 'react';
import { Card, Field, LoadingBlock, Notice, PageHeader, Spinner } from '@/components/admin/ui';
import { useAdminAuth } from '@/context/AdminAuthContext';
import { callFunction } from '@/lib/supabase';
import { formatDateTime } from '@/data/orders';

interface UserRow {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  is_admin: boolean;
  created_at: string;
}

export default function AdminUsersPage() {
  const { session } = useAdminAuth();
  const [users, setUsers] = useState<UserRow[] | null>(null);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');
  const [createForm, setCreateForm] = useState({ email: '', password: '', first_name: '', last_name: '', is_admin: false });
  const [resetting, setResetting] = useState<string | null>(null);
  const [resetMsg, setResetMsg] = useState('');

  const load = () => {
    setUsers(null);
    setError('');
    callFunction<{ users: UserRow[] }>('admin-manage', { action: 'list_users' }, session?.access_token)
      .then((r) => setUsers(r.users))
      .catch(() => setError('Uporabnikov ni bilo mogoče naložiti.'));
  };

  useEffect(load, [session]);

  const filtered = (users ?? []).filter((u) => {
    const q = query.toLowerCase().trim();
    if (!q) return true;
    return u.email.toLowerCase().includes(q) || `${u.first_name} ${u.last_name}`.toLowerCase().includes(q);
  });

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setCreateError('');
    try {
      await callFunction('admin-manage', { action: 'create_user', ...createForm }, session?.access_token);
      setCreateForm({ email: '', password: '', first_name: '', last_name: '', is_admin: false });
      setShowCreate(false);
      load();
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : 'Napaka pri ustvarjanju uporabnika.');
    } finally {
      setCreating(false);
    }
  };

  const handleReset = async (email: string) => {
    setResetting(email);
    setResetMsg('');
    try {
      await callFunction('admin-manage', { action: 'reset_password', email }, session?.access_token);
      setResetMsg(`Povezava za ponastavitev gesla je poslana na ${email}.`);
    } catch (err) {
      setResetMsg(err instanceof Error ? err.message : 'Napaka pri pošiljanju povezave.');
    } finally {
      setResetting(null);
    }
  };

  const handleToggleAdmin = async (user: UserRow) => {
    try {
      if (user.is_admin) {
        await callFunction('admin-manage', { action: 'remove_admin', user_id: user.id }, session?.access_token);
      } else {
        await callFunction('admin-manage', { action: 'add_admin', user_id: user.id }, session?.access_token);
      }
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Napaka pri spremembi pravic.');
    }
  };

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Uporabniki"
        description={`${users?.length ?? 0} uporabnikov`}
        actions={
          <button type="button" onClick={() => setShowCreate((v) => !v)} className="admin-btn">
            <UserPlus className="h-4 w-4" /> Nov uporabnik
          </button>
        }
      />

      {showCreate && (
        <Card title="Nov uporabnik" description="Ustvarite nov račun za stranko ali skrbnika.">
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Ime">
                <input value={createForm.first_name} onChange={(e) => setCreateForm((f) => ({ ...f, first_name: e.target.value }))} className="admin-input" />
              </Field>
              <Field label="Priimek">
                <input value={createForm.last_name} onChange={(e) => setCreateForm((f) => ({ ...f, last_name: e.target.value }))} className="admin-input" />
              </Field>
            </div>
            <Field label="E-poštni naslov">
              <input type="email" required value={createForm.email} onChange={(e) => setCreateForm((f) => ({ ...f, email: e.target.value }))} className="admin-input" />
            </Field>
            <Field label="Geslo" hint="Vsaj 8 znakov. Uporabnik lahko geslo spremeni kasneje.">
              <input type="password" required minLength={8} value={createForm.password} onChange={(e) => setCreateForm((f) => ({ ...f, password: e.target.value }))} className="admin-input" />
            </Field>
            <label className="flex items-center gap-3 text-sm text-navy-800">
              <input type="checkbox" checked={createForm.is_admin} onChange={(e) => setCreateForm((f) => ({ ...f, is_admin: e.target.checked }))} className="h-4 w-4 accent-navy-900" />
              Ustvari kot skrbnika (dostop do nadzorne plošče)
            </label>
            {createError && <Notice tone="error">{createError}</Notice>}
            <div className="flex gap-2">
              <button type="submit" disabled={creating} className="admin-btn">
                {creating && <Spinner />} Ustvari uporabnika
              </button>
              <button type="button" onClick={() => setShowCreate(false)} className="admin-btn-secondary">
                Prekliči
              </button>
            </div>
          </form>
        </Card>
      )}

      {resetMsg && <div className="mb-4"><Notice tone="info">{resetMsg}</Notice></div>}
      {error && <div className="mb-4"><Notice tone="error">{error}</Notice></div>}

      <div className="mb-4 relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-navy-300" />
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Iskanje po e-pošti ali imenu" className="admin-input pl-9" />
      </div>

      {!users ? (
        <LoadingBlock />
      ) : (
        <div className="overflow-hidden rounded-xl border border-navy-100 bg-white">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead className="border-b border-navy-100 bg-navy-50/50 text-left text-xs uppercase tracking-wider text-navy-800/60">
                <tr>
                  <th className="px-4 py-3 font-medium">Uporabnik</th>
                  <th className="px-4 py-3 font-medium">Vloga</th>
                  <th className="px-4 py-3 font-medium">Ustvarjen</th>
                  <th className="px-4 py-3 text-right font-medium">Dejanja</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-navy-50">
                {filtered.map((u) => (
                  <tr key={u.id} className="group transition-colors hover:bg-navy-50/40">
                    <td className="px-4 py-3">
                      <span className="block font-medium text-navy-900">
                        {u.first_name || u.last_name ? `${u.first_name} ${u.last_name}`.trim() : 'Brez imena'}
                      </span>
                      <span className="block text-xs text-navy-800/50">{u.email}</span>
                    </td>
                    <td className="px-4 py-3">
                      {u.is_admin ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-gold-50 px-2 py-0.5 text-xs font-medium text-gold-800 ring-1 ring-gold-200">
                          <Shield className="h-3 w-3" /> Skrbnik
                        </span>
                      ) : (
                        <span className="text-xs text-navy-800/50">Stranka</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-navy-800/50">{formatDateTime(u.created_at)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => handleReset(u.email)}
                          disabled={resetting === u.email}
                          title="Pošlji povezavo za ponastavitev gesla"
                          className="rounded-lg p-2 text-navy-600 hover:bg-navy-50 hover:text-navy-900 disabled:opacity-40"
                        >
                          {resetting === u.email ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleToggleAdmin(u)}
                          title={u.is_admin ? 'Odstrani skrbniške pravice' : 'Dodeli skrbniške pravice'}
                          className="rounded-lg p-2 text-navy-600 hover:bg-navy-50 hover:text-navy-900"
                        >
                          {u.is_admin ? <ShieldOff className="h-4 w-4" /> : <Shield className="h-4 w-4" />}
                        </button>
                        <a
                          href={`mailto:${u.email}`}
                          title="Pošlji e-pošto"
                          className="rounded-lg p-2 text-navy-600 hover:bg-navy-50 hover:text-navy-900"
                        >
                          <Mail className="h-4 w-4" />
                        </a>
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-4 py-16 text-center text-navy-800/50">
                      Ni najdenih uporabnikov.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
