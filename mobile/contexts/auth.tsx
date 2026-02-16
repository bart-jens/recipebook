import { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (email: string, password: string, inviteCode: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  loading: true,
  signIn: async () => ({ error: null }),
  signUp: async () => ({ error: null }),
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  async function signIn(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error?.message || null };
  }

  async function signUp(email: string, password: string, inviteCode: string) {
    const code = inviteCode.trim().toUpperCase();
    if (!code) return { error: 'Invite code is required' };

    // Validate invite code
    const { data: invite } = await supabase
      .from('invites')
      .select('id, used_at')
      .eq('code', code)
      .single();

    if (!invite) return { error: 'Invalid invite code' };
    if (invite.used_at) return { error: 'This invite code has already been used' };

    // Create user
    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { invite_code: code } },
    });

    if (signUpError) return { error: signUpError.message };

    // Mark invite as used
    await supabase
      .from('invites')
      .update({ used_at: new Date().toISOString() })
      .eq('id', invite.id);

    return { error: null };
  }

  async function signOut() {
    await supabase.auth.signOut();
  }

  return (
    <AuthContext.Provider
      value={{
        session,
        user: session?.user ?? null,
        loading,
        signIn,
        signUp,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
