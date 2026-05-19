import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { Heading } from './Heading';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Layers, Shield, Sparkles, Mail, Lock, Loader2, ArrowRight } from 'lucide-react';

/** Where we send the user after sign-in (e.g. return to a scanned /resource/:id link). */
type LoginLocationState = { from?: { pathname: string } };

/** Sign-in page: email and password, then go to the home screen if it works. */
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
      console.error('Login error:', error.message);
      setSubmitError(error.message);
    } else {
      const state = location.state as LoginLocationState | null;
      const path = state?.from?.pathname;
      const safe =
        path && path !== '/login' && path.startsWith('/') ? path : '/';
      navigate(safe, { replace: true });
    }
  };

  const inputWrap =
    'flex items-center gap-3 w-full rounded-xl border border-slate-200 bg-slate-50/80 px-3.5 py-2.5 shadow-inner shadow-slate-100/80 transition-colors focus-within:border-indigo-400 focus-within:bg-white focus-within:ring-2 focus-within:ring-indigo-500/20';

  const highlights = [
    { icon: Layers, title: 'Organize workspaces', detail: 'Keep teams and equipment in one place.' },
    { icon: Shield, title: 'Role-aware access', detail: 'Admins and members see what they need.' },
    { icon: Sparkles, title: 'Fast handoff', detail: 'Scan resources and resume where you left off.' },
  ] as const;

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-50">
      {/* Soft ambient background */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(99,102,241,0.18),transparent),radial-gradient(ellipse_60%_40%_at_100%_50%,rgba(14,165,233,0.08),transparent),radial-gradient(ellipse_50%_30%_at_0%_80%,rgba(99,102,241,0.12),transparent)]"
      />
      <div aria-hidden className="pointer-events-none absolute -top-40 -right-40 h-96 w-96 rounded-full bg-indigo-200/40 blur-3xl" />
      <div aria-hidden className="pointer-events-none absolute -bottom-32 -left-32 h-80 w-80 rounded-full bg-sky-200/35 blur-3xl" />

      <div className="relative mx-auto flex min-h-screen max-w-6xl flex-col justify-center px-4 py-12 lg:flex-row lg:items-center lg:gap-16 lg:px-8">
        {/* Brand panel */}
        <section className="mb-10 max-w-xl lg:mb-0 lg:flex-1">
          <Heading className="text-left" />
          <p className="mt-4 text-lg font-medium text-slate-600 sm:text-xl">
            Manage teams, resources, and approvals in one calm workspace hub.
          </p>
          <ul className="mt-10 space-y-4">
            {highlights.map(({ icon: Icon, title, detail }) => (
              <li key={title} className="flex gap-4 rounded-2xl border border-slate-200/80 bg-white/60 px-4 py-3 shadow-sm shadow-slate-200/40 backdrop-blur-sm">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-lg shadow-indigo-500/25">
                  <Icon size={20} strokeWidth={2} aria-hidden />
                </div>
                <div>
                  <p className="font-semibold text-slate-900">{title}</p>
                  <p className="mt-0.5 text-sm text-slate-500">{detail}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>

        {/* Sign-in card */}
        <div className="w-full max-w-md shrink-0">
          <div className="rounded-3xl border border-slate-200/90 bg-white/90 p-8 shadow-xl shadow-slate-200/50 ring-1 ring-white/70 backdrop-blur-md sm:p-9">
            <div className="mb-8">
              <h2 className="text-2xl font-semibold tracking-tight text-slate-900">
                Welcome back
              </h2>
              <p className="mt-2 text-sm text-slate-500">
                Sign in with your organizational email to continue.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {submitError && (
                <div
                  role="alert"
                  className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800"
                >
                  {submitError}
                </div>
              )}

              <div className="space-y-1.5">
                <label htmlFor="login-email" className="text-sm font-medium text-slate-700">
                  Email
                </label>
                <div className={inputWrap}>
                  <Mail className="h-5 w-5 shrink-0 text-slate-400" aria-hidden />
                  <input
                    id="login-email"
                    type="email"
                    autoComplete="email"
                    placeholder="you@school.edu"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setSubmitError(null);
                    }}
                    className="min-w-0 flex-1 border-0 bg-transparent text-slate-900 placeholder:text-slate-400 outline-none"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <label htmlFor="login-password" className="text-sm font-medium text-slate-700">
                    Password
                  </label>
                  <Link
                    to="/reset-password"
                    className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 hover:underline"
                  >
                    Forgot password?
                  </Link>
                </div>
                <div className={inputWrap}>
                  <Lock className="h-5 w-5 shrink-0 text-slate-400" aria-hidden />
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
                    className="min-w-0 flex-1 border-0 bg-transparent text-slate-900 placeholder:text-slate-400 outline-none"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="group flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 transition hover:bg-indigo-700 hover:shadow-indigo-500/40 disabled:opacity-60 disabled:pointer-events-none"
              >
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

              <p className="text-center text-sm text-slate-600">
                New here?{' '}
                <Link to="/signup" className="font-semibold text-indigo-600 hover:underline">
                  Create an account
                </Link>
              </p>
            </form>
          </div>
          <p className="mt-8 text-center text-xs text-slate-400 lg:text-left">
            By signing in you agree to follow your organization’s policies for workspace data.
          </p>
        </div>
      </div>
    </div>
  );
}
