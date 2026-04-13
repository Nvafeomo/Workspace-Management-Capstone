import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { Loader2, Lock, Mail, ArrowLeft } from 'lucide-react';

export const ResetPassword = () => {
    const [view, setView] = useState<'REQUEST' | 'UPDATE'>('REQUEST'); // Keeps track of which form to show: 'REQUEST' (email) or 'UPDATE' (new password)

    const [email, setEmail] = useState(''); // State for the form inputs
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const [loading, setLoading] = useState(false); // UI states for loading spinners and success/error feedback
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    const navigate = useNavigate();

    useEffect(() => { // Listen for the redirect from the user's email link
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            if (event === 'PASSWORD_RECOVERY') { // If they clicked the reset link, Supabase sends this specific event
                setView('UPDATE'); // Switch over to the new password form
                setMessage(null);  // Clear out any old messages
            }
        });

        return () => subscription.unsubscribe(); // Cleanup function to unsubscribe and prevent memory leaks when the component unmounts
    }, []);

    const handleRequestReset = async (e: React.FormEvent) => { // Function to handle sending the initial reset email
        e.preventDefault(); // Stop the page from refreshing on submit
        setLoading(true);
        setMessage(null);

        try {
            const { error } = await supabase.auth.resetPasswordForEmail(email, { // Tell Supabase to send the recovery email and redirect back to this exact page
                redirectTo: `${window.location.origin}/reset-password`,
            });

            if (error) throw error;
            setMessage({ type: 'success', text: 'Check your email for the password reset link!' });
        } catch (error: any) {
            setMessage({ type: 'error', text: error.message || 'Failed to send reset email.' });
        } finally {
            setLoading(false); // Turn off the loading spinner regardless of success/fail
        }
    };

    const handleUpdatePassword = async (e: React.FormEvent) => { // Function to handle saving the actual new password
        e.preventDefault();

        if (password !== confirmPassword) { // Catch typos: Make sure the passwords match before pinging the database
            setMessage({ type: 'error', text: 'Passwords do not match. Please try again.' });
            return; // Exit the function early
        }

        setLoading(true);
        setMessage(null);

        try {
            const { error } = await supabase.auth.updateUser({ password }); // Send the new password to Supabase to update the currently recovering user
            if (error) throw error;

            alert("Password updated successfully!");
            navigate('/'); // Kick them back to the main dashboard
        } catch (error: any) {
            setMessage({ type: 'error', text: error.message || 'Failed to update password.' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 space-y-6 border border-slate-100">

                <div className="text-center space-y-2">
                    {/* Header text changes dynamically based on the current view */}
                    <h1 className="text-3xl font-extrabold text-slate-900">
                        {view === 'REQUEST' ? 'Reset Password' : 'Set New Password'}
                    </h1>
                    <p className="text-slate-500">
                        {view === 'REQUEST'
                            ? "Enter your email and we'll send you a reset link."
                            : "Please enter your new password below."}
                    </p>
                </div>

                {/* Display success or error messages if they exist */}
                {message && (
                    <div className={`p-4 rounded-xl text-sm font-medium ${message.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                        {message.text}
                    </div>
                )}

                {view === 'REQUEST' ? (
                    // --- VIEW 1: REQUEST EMAIL LINK FORM ---
                    <form onSubmit={handleRequestReset} className="space-y-4">
                        <div className="space-y-1">
                            <label className="text-sm font-bold text-slate-700">Email Address</label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                                <input
                                    required
                                    type="email"
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all"
                                    placeholder="you@example.com"
                                />
                            </div>
                        </div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {loading ? <Loader2 className="animate-spin" size={20} /> : 'Send Reset Link'}
                        </button>
                    </form>
                ) : (
                    // --- VIEW 2: TYPE NEW PASSWORD FORM ---
                    <form onSubmit={handleUpdatePassword} className="space-y-4">
                        <div className="space-y-1">
                            <label className="text-sm font-bold text-slate-700">New Password</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                                <input
                                    required
                                    type="password"
                                    minLength={6}
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all"
                                    placeholder="Enter new password"
                                />
                            </div>
                        </div>

                        <div className="space-y-1">
                            {/* Confirm Password Field */}
                            <label className="text-sm font-bold text-slate-700">Confirm Password</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                                <input
                                    required
                                    type="password"
                                    minLength={6} // Enforce minimum length for security
                                    value={confirmPassword}
                                    onChange={e => setConfirmPassword(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all"
                                    placeholder="Confirm new password"
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {loading ? <Loader2 className="animate-spin" size={20} /> : 'Update Password'}
                        </button>
                    </form>
                )}

                {/* Only show the Back to Login button if they are on the initial request view */}
                {view === 'REQUEST' && (
                    <div className="text-center">
                        <Link to="/login" className="inline-flex items-center gap-2 text-sm font-bold text-indigo-600 hover:text-indigo-700 transition-colors">
                            <ArrowLeft size={16} />
                            Back to Login
                        </Link>
                    </div>
                )}

            </div>
        </div>
    );
};