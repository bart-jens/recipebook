import { createContext, useContext, useEffect, useState } from 'react';
import { Session, User, Provider } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import * as WebBrowser from 'expo-web-browser';
import { makeRedirectUri } from 'expo-auth-session';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as Crypto from 'expo-crypto';

const API_BASE = process.env.EXPO_PUBLIC_API_URL || '';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  loading: boolean;
  needsInviteVerification: boolean;
  clearInviteVerification: () => void;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (email: string, password: string, inviteCode?: string) => Promise<{ error: string | null }>;
  signInWithOAuth: (provider: Provider) => Promise<{ error: string | null }>;
  signInWithApple: () => Promise<{ error: string | null }>;
  resetPassword: (email: string) => Promise<{ error: string | null }>;
  updatePassword: (newPassword: string) => Promise<{ error: string | null }>;
  isPasswordReset: boolean;
  clearPasswordReset: () => void;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  loading: true,
  needsInviteVerification: false,
  clearInviteVerification: () => {},
  signIn: async () => ({ error: null }),
  signUp: async () => ({ error: null }),
  signInWithOAuth: async () => ({ error: null }),
  signInWithApple: async () => ({ error: null }),
  resetPassword: async () => ({ error: null }),
  updatePassword: async () => ({ error: null }),
  isPasswordReset: false,
  clearPasswordReset: () => {},
  signOut: async () => {},
});

function isNewOAuthUser(user: User): boolean {
  const identity = user.identities?.[0];
  if (!identity) return false;
  return new Date(identity.created_at).getTime() > Date.now() - 120_000;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPasswordReset, setIsPasswordReset] = useState(false);
  const [needsInviteVerification, setNeedsInviteVerification] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      if (event === 'PASSWORD_RECOVERY') {
        setIsPasswordReset(true);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function signIn(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error?.message || null };
  }

  async function signUp(email: string, password: string, inviteCode?: string) {
    const code = inviteCode?.trim().toUpperCase() || "";

    try {
      const response = await fetch(`${API_BASE}/api/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, ...(code ? { inviteCode: code } : {}) }),
      });

      const data = await response.json();
      if (!response.ok) {
        return { error: data.error || 'Signup failed' };
      }
    } catch {
      return { error: 'Could not connect to server' };
    }

    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    if (signInError) return { error: signInError.message };

    return { error: null };
  }

  async function signInWithOAuth(provider: Provider) {
    try {
      const redirectTo = makeRedirectUri();
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: { redirectTo, skipBrowserRedirect: true },
      });
      if (error) return { error: error.message };
      if (data.url) {
        const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
        if (result.type === 'success' && result.url) {
          const url = new URL(result.url);
          const params = new URLSearchParams(url.hash.substring(1));
          const accessToken = params.get('access_token');
          const refreshToken = params.get('refresh_token');
          if (accessToken && refreshToken) {
            await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
            const { data: { user } } = await supabase.auth.getUser();
            if (user && isNewOAuthUser(user)) {
              setNeedsInviteVerification(true);
            }
            return { error: null };
          }
        }
      }
      return { error: 'Sign in was cancelled' };
    } catch {
      return { error: 'Could not connect to sign in provider' };
    }
  }

  async function signInWithApple() {
    try {
      const nonce = Crypto.randomUUID();
      const hashedNonce = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        nonce,
      );
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
        nonce: hashedNonce,
      });
      if (!credential.identityToken) {
        return { error: 'Apple did not return an identity token' };
      }
      const { error } = await supabase.auth.signInWithIdToken({
        provider: 'apple',
        token: credential.identityToken,
        nonce,
      });
      if (error) return { error: error.message };
      const { data: { user } } = await supabase.auth.getUser();
      if (user && isNewOAuthUser(user)) {
        setNeedsInviteVerification(true);
      }
      return { error: null };
    } catch (e: any) {
      if (e.code === 'ERR_REQUEST_CANCELED') {
        return { error: null };
      }
      return { error: e.message || 'Sign in with Apple failed' };
    }
  }

  async function resetPassword(email: string) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: 'eefeats://reset-password',
    });
    return { error: error?.message || null };
  }

  async function updatePassword(newPassword: string) {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    return { error: error?.message || null };
  }

  function clearPasswordReset() {
    setIsPasswordReset(false);
  }

  function clearInviteVerification() {
    setNeedsInviteVerification(false);
  }

  async function signOut() {
    setNeedsInviteVerification(false);
    await supabase.auth.signOut();
  }

  return (
    <AuthContext.Provider
      value={{
        session,
        user: session?.user ?? null,
        loading,
        needsInviteVerification,
        clearInviteVerification,
        signIn,
        signUp,
        signInWithOAuth,
        signInWithApple,
        resetPassword,
        updatePassword,
        isPasswordReset,
        clearPasswordReset,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
