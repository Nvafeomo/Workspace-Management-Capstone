import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Mail, Lock, Loader2, ArrowRight } from 'lucide-react';
import { AuthLayout } from '../components/auth/AuthLayout';
import {
  authInputWrap,
  authInput,
  authLabel,
  authSubmitBtn,
} from '../components/auth/authStyles';

type LoginLocationState = { from?: { pathname: string } };

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    setSubmitting(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setSubmitting(false);
    if (error) {
      setSubmitError(error.message);
    } else {
      const state = location.state as LoginLocationState | null;
      const path = state?.from?.pathname;
      const safe = path && path !== '/login' && path.startsWith('/') ? path : '/';
      navigate(safe, { replace: true });
    }
  };

  return (
    <AuthLayout
      cardTitle="Welcome back"
      cardSubtitle="Sign in with your campus email to access workspaces, reservations, and equipment."
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {submitError && (
          <div
            role="alert"
            className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200"
          >
            {submitError}
          </div>
        )}

        <div className="space-y-1.5">
          <label htmlFor="login-email" className={authLabel}>
            Email
          </label>
          <div className={authInputWrap}>
            <Mail className="h-5 w-5 shrink-0 text-slate-500" aria-hidden />
            <input
              id="login-email"
              type="email"
              autoComplete="email"
              placeholder="you@university.edu"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setSubmitError(null);
              }}
              className={authInput}
              required
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between gap-2">
            <label htmlFor="login-password" className={authLabel}>
              Password
            </label>
            <Link
              to="/reset-password"
              className="text-xs font-semibold text-indigo-300 hover:text-indigo-200"
            >
              Forgot password?
            </Link>
          </div>
          <div className={authInputWrap}>
            <Lock className="h-5 w-5 shrink-0 text-slate-500" aria-hidden />
            <input
              id="login-password"
              type="password"
              autoComplete="current-password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setSubmitError(null);
              }}
              className={authInput}
              required
            />
          </div>
        </div>

        <button type="submit" disabled={submitting} className={authSubmitBtn}>
          {submitting ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
              Signing in…
            </>
          ) : (
            <>
              Sign in
              <ArrowRight className="h-5 w-5 transition group-hover:translate-x-0.5" aria-hidden />
            </>
          )}
        </button>

        <p className="text-center text-sm text-slate-400">
          New here?{' '}
          <Link to="/signup" className="font-semibold text-indigo-300 hover:text-white">
            Create an account
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}
