import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '../supabaseClient';

/**
 * Keeps track of who is signed in and shares that with the whole app.
 * Use useAuth() anywhere you need the current user or to sign out.
 */

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
  /** Name we show in the header (from your profile, or your email) */
  displayName: string | null;
  /** Your role ex: admin, member, approver, owner — used to show extra menus */
  globalRole: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [globalRole, setGlobalRole] = useState<string | null>(null);


  useEffect(() => {
    // See if someone is already logged in (including after a page refresh)
    supabase.auth.getSession()
      .then(({ data: { session } }) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
        if (session?.user) {
          // Load name and role right after — keeps sign-in from freezing
          const u = session.user;
          setTimeout(() => {
            fetchDisplayName(u).then(setDisplayName).catch(() => setDisplayName(null));
            fetchGlobalRole(u).then(setGlobalRole).catch(() => setGlobalRole(null));
          }, 0);
        } else {
          setDisplayName(null);
        }
      })
      .catch((err) => {
        console.error('Auth getSession failed:', err);
        setLoading(false);
      });

    // When they sign in, sign out, or the session updates, keep state in sync
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          const u = session.user;
          setTimeout(() => {
            fetchDisplayName(u).then(setDisplayName).catch(() => setDisplayName(null));
            fetchGlobalRole(u).then(setGlobalRole).catch(() => setGlobalRole(null));

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
    globalRole,

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

/** Looks up your name in our database; if missing, uses what you typed at signup or your email. */
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

  const meta = user.user_metadata;
  if (meta?.first_name || meta?.last_name) {
    return [meta.first_name, meta.last_name].filter(Boolean).join(' ').trim() || null;
  }
  return user.email ?? null;
}

/** Loads your role from the users table. */
async function fetchGlobalRole(user: User): Promise<string | null> {
  const { data } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();

  return data?.role ?? null;
}

