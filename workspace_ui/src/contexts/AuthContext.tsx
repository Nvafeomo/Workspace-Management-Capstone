import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '../supabaseClient';

/**
 * AuthContext provides the current user and session across the app.
 *
 * Purpose:
 * - Single source of truth for "who is logged in"
 * - Components can use useAuth() instead of calling supabase.auth everywhere
 * - Handles session persistence (refresh on page load, listen for sign in/out)
 */

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
  /** Display name from users table or metadata (first_name + last_name) */
  displayName: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [displayName, setDisplayName] = useState<string | null>(null);

  useEffect(() => {
    // 1. Get initial session (e.g. on page load / refresh)
    supabase.auth.getSession()
      .then(({ data: { session } }) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
        if (session?.user) {
          // Defer fetch - avoids auth lock contention with workspace API calls
          const u = session.user;
          setTimeout(() => {
            fetchDisplayName(u).then(setDisplayName).catch(() => setDisplayName(null));
          }, 0);
        } else {
          setDisplayName(null);
        }
      })
      .catch((err) => {
        console.error('Auth getSession failed:', err);
        setLoading(false);
      });

    // 2. Listen for auth changes (sign in, sign out, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          // Defer fetch - Supabase DB calls inside this callback cause auth lock deadlock
          const u = session.user;
          setTimeout(() => {
            fetchDisplayName(u).then(setDisplayName).catch(() => setDisplayName(null));
          }, 0);
        } else {
          setDisplayName(null);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const value: AuthContextType = {
    user,
    session,
    loading,
    signOut,
    displayName,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

/**
 * Fetches display name from public.users, or falls back to user_metadata / email.
 */
async function fetchDisplayName(user: User): Promise<string | null> {
  const { data } = await supabase
    .from('users')
    .select('name, first_name, last_name')
    .eq('id', user.id)
    .single();

  if (data?.name) return data.name;
  if (data?.first_name || data?.last_name) {
    return [data.first_name, data.last_name].filter(Boolean).join(' ').trim() || null;
  }

  // Fallback: auth user metadata (from signup options.data)
  const meta = user.user_metadata;
  if (meta?.first_name || meta?.last_name) {
    return [meta.first_name, meta.last_name].filter(Boolean).join(' ').trim() || null;
  }
  return user.email ?? null;
}
