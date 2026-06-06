import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, User, Loader2, ArrowRight, CheckCircle2 } from 'lucide-react';
import { AuthLayout } from '../components/auth/AuthLayout';
import {
  authInputWrap,
  authInput,
  authLabel,
  authSubmitBtn,
} from '../components/auth/authStyles';

export default function Signup() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    if (password !== confirmPassword) {
      setSubmitError('Passwords do not match.');
      return;
    }
    if (password.length < 6) {
      setSubmitError('Password must be at least 6 characters.');
      return;
    }

    setSubmitting(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { first_name: firstName, last_name: lastName },
      },
    });
    setSubmitting(false);

    if (error) {
      setSubmitError(error.message);
    } else {
      setSuccess(true);
    }
  };

  if (success) {
    return (
      <AuthLayout
        cardTitle="Check your inbox"
        cardSubtitle="We sent a confirmation link if your campus requires email verification."
      >
        <div className="space-y-6 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/15 ring-1 ring-emerald-400/30">
            <CheckCircle2 className="h-8 w-8 text-emerald-400" aria-hidden />
          </div>
          <p className="text-sm leading-relaxed text-slate-400">
            Account created for <span className="font-medium text-slate-200">{email}</span>.
            Confirm your email if prompted, then sign in.
          </p>
          <button
            type="button"
            onClick={() => navigate('/login')}
            className={authSubmitBtn}
          >
            Go to sign in
            <ArrowRight className="h-5 w-5" aria-hidden />
          </button>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      cardTitle="Create your account"
      cardSubtitle="Join your department workspaces to reserve labs and borrow equipment."
      backTo={{ label: 'Back to sign in', to: '/login' }}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {submitError && (
          <div
            role="alert"
            className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200"
          >
            {submitError}
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label htmlFor="signup-first" className={authLabel}>
              First name
            </label>
            <div className={authInputWrap}>
              <User className="h-5 w-5 shrink-0 text-slate-500" aria-hidden />
              <input
                id="signup-first"
                type="text"
                autoComplete="given-name"
                placeholder="First"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className={authInput}
                required
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <label htmlFor="signup-last" className={authLabel}>
              Last name
            </label>
            <div className={authInputWrap}>
              <input
                id="signup-last"
                type="text"
                autoComplete="family-name"
                placeholder="Last"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className={authInput}
                required
              />
            </div>
          </div>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="signup-email" className={authLabel}>
            Campus email
          </label>
          <div className={authInputWrap}>
            <Mail className="h-5 w-5 shrink-0 text-slate-500" aria-hidden />
            <input
              id="signup-email"
              type="email"
              autoComplete="email"
              placeholder="you@university.edu"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={authInput}
              required
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="signup-password" className={authLabel}>
            Password
          </label>
          <div className={authInputWrap}>
            <Lock className="h-5 w-5 shrink-0 text-slate-500" aria-hidden />
            <input
              id="signup-password"
              type="password"
              autoComplete="new-password"
              placeholder="At least 6 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={authInput}
              required
              minLength={6}
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="signup-confirm" className={authLabel}>
            Confirm password
          </label>
          <div className={authInputWrap}>
            <Lock className="h-5 w-5 shrink-0 text-slate-500" aria-hidden />
            <input
              id="signup-confirm"
              type="password"
              autoComplete="new-password"
              placeholder="Repeat password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className={authInput}
              required
            />
          </div>
        </div>

        <button type="submit" disabled={submitting} className={authSubmitBtn}>
          {submitting ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
              Creating account…
            </>
          ) : (
            <>
              Create account
              <ArrowRight className="h-5 w-5 transition group-hover:translate-x-0.5" aria-hidden />
            </>
          )}
        </button>

        <p className="text-center text-sm text-slate-400">
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-indigo-300 hover:text-white">
            Sign in
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}
