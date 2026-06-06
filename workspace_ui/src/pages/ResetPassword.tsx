import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { Loader2, Lock, Mail, ArrowRight } from 'lucide-react';
import { AuthLayout } from '../components/auth/AuthLayout';
import {
  authInputWrap,
  authInput,
  authLabel,
  authSubmitBtn,
} from '../components/auth/authStyles';

export const ResetPassword = () => {
  const [view, setView] = useState<'REQUEST' | 'UPDATE'>('REQUEST');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setView('UPDATE');
        setMessage(null);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      setMessage({ type: 'success', text: 'Check your email for the password reset link.' });
    } catch (error: unknown) {
      const text =
        error && typeof error === 'object' && 'message' in error
          ? String((error as Error).message)
          : 'Failed to send reset email.';
      setMessage({ type: 'error', text });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setMessage({ type: 'error', text: 'Passwords do not match. Please try again.' });
      return;
    }
    setLoading(true);
    setMessage(null);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      navigate('/', { replace: true });
    } catch (error: unknown) {
      const text =
        error && typeof error === 'object' && 'message' in error
          ? String((error as Error).message)
          : 'Failed to update password.';
      setMessage({ type: 'error', text });
    } finally {
      setLoading(false);
    }
  };

  const isRequest = view === 'REQUEST';

  return (
    <AuthLayout
      cardTitle={isRequest ? 'Reset password' : 'Set new password'}
      cardSubtitle={
        isRequest
          ? "Enter your campus email and we'll send a secure reset link."
          : 'Choose a strong password for your Campus Spaces account.'
      }
      backTo={isRequest ? { label: 'Back to sign in', to: '/login' } : undefined}
      highlights={[
        {
          icon: Mail,
          title: 'Secure recovery',
          detail: 'Reset links expire and are tied to your account only.',
        },
        {
          icon: Lock,
          title: 'Stay signed in',
          detail: 'After updating, you can return to your workspaces right away.',
        },
      ]}
    >
      {message && (
        <div
          role="alert"
          className={`mb-5 rounded-xl border px-4 py-3 text-sm ${
            message.type === 'success'
              ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200'
              : 'border-rose-500/30 bg-rose-500/10 text-rose-200'
          }`}
        >
          {message.text}
        </div>
      )}

      {isRequest ? (
        <form onSubmit={handleRequestReset} className="space-y-5">
          <div className="space-y-1.5">
            <label htmlFor="reset-email" className={authLabel}>
              Email
            </label>
            <div className={authInputWrap}>
              <Mail className="h-5 w-5 shrink-0 text-slate-500" aria-hidden />
              <input
                id="reset-email"
                required
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={authInput}
                placeholder="you@university.edu"
              />
            </div>
          </div>
          <button type="submit" disabled={loading} className={authSubmitBtn}>
            {loading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
                Sending…
              </>
            ) : (
              'Send reset link'
            )}
          </button>
        </form>
      ) : (
        <form onSubmit={handleUpdatePassword} className="space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="new-password" className={authLabel}>
              New password
            </label>
            <div className={authInputWrap}>
              <Lock className="h-5 w-5 shrink-0 text-slate-500" aria-hidden />
              <input
                id="new-password"
                required
                type="password"
                minLength={6}
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={authInput}
                placeholder="At least 6 characters"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <label htmlFor="confirm-password" className={authLabel}>
              Confirm password
            </label>
            <div className={authInputWrap}>
              <Lock className="h-5 w-5 shrink-0 text-slate-500" aria-hidden />
              <input
                id="confirm-password"
                required
                type="password"
                minLength={6}
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={authInput}
                placeholder="Repeat new password"
              />
            </div>
          </div>
          <button type="submit" disabled={loading} className={authSubmitBtn}>
            {loading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
                Updating…
              </>
            ) : (
              <>
                Update password
                <ArrowRight className="h-5 w-5" aria-hidden />
              </>
            )}
          </button>
          <p className="text-center text-sm text-slate-400">
            <Link to="/login" className="font-semibold text-indigo-300 hover:text-white">
              Back to sign in
            </Link>
          </p>
        </form>
      )}
    </AuthLayout>
  );
};
