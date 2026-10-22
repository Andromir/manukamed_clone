import type { Session } from '@supabase/supabase-js';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { supabase } from '@/lib/supabase';

interface AdminAuthValue {
  session: Session | null;
  isAdmin: boolean;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<string | null>;
  createFirstAdmin: (email: string, password: string) => Promise<string | null>;
  signOut: () => Promise<void>;
}

const AdminAuthContext = createContext<AdminAuthValue | null>(null);

function authMessage(message: string) {
  const m = message.toLowerCase();
  if (m.includes('invalid login')) return 'Napačen e-poštni naslov ali geslo.';
  if (m.includes('already registered')) return 'Ta e-poštni naslov je že registriran. Prijavite se.';
  if (m.includes('password')) return 'Geslo mora imeti vsaj 8 znakov.';
  if (m.includes('fetch')) return 'Povezava s strežnikom ni uspela.';
  return message;
}

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  const resolve = useCallback(async (next: Session | null) => {
    setSession(next);
    if (!next) {
      setIsAdmin(false);
      setLoading(false);
      return;
    }
    const { data } = await supabase.rpc('is_admin');
    setIsAdmin(data === true);
    setLoading(false);
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => resolve(data.session));
    const { data } = supabase.auth.onAuthStateChange((_event, next) => {
      (async () => {
        await resolve(next);
      })();
    });
    return () => data.subscription.unsubscribe();
  }, [resolve]);

  const signIn = useCallback(async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return authMessage(error.message);
    const { data: admin } = await supabase.rpc('is_admin');
    if (admin !== true) {
      await supabase.auth.signOut();
      return 'Ta račun nima skrbniških pravic.';
    }
    await resolve(data.session);
    return null;
  }, [resolve]);

  const createFirstAdmin = useCallback(async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) return authMessage(error.message);
    if (!data.session) return 'Račun je ustvarjen, vendar prijava ni uspela. Poskusite se prijaviti.';
    const { data: claimed, error: claimError } = await supabase.rpc('claim_first_admin');
    if (claimError || claimed !== true) {
      await supabase.auth.signOut();
      return 'Skrbniški račun že obstaja. Prijavite se z obstoječim računom.';
    }
    await resolve(data.session);
    return null;
  }, [resolve]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  const value = useMemo(
    () => ({ session, isAdmin, loading, signIn, createFirstAdmin, signOut }),
    [session, isAdmin, loading, signIn, createFirstAdmin, signOut],
  );

  return <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAdminAuth() {
  const ctx = useContext(AdminAuthContext);
  if (!ctx) throw new Error('useAdminAuth must be used within AdminAuthProvider');
  return ctx;
}
