import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { Heading } from './Heading';
import { Link, useNavigate } from 'react-router-dom';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      console.error("Login error:", error.message);
      alert("Login failed: " + error.message);
    } else {
      navigate('/', { replace: true });
    }
  };

  const inputClass = "w-full border border-slate-200 rounded-lg px-3 py-2";
  const btnClass = "w-full bg-indigo-600 text-white py-2.5 rounded-lg font-medium transition-all duration-150 hover:bg-indigo-700 hover:scale-105 active:scale-95";

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
      <div className="mb-25">
        <Heading />
        <p className="mt-2 text-center text-base font-medium text-indigo-600">Manage your teams &amp; resources</p>
      </div>
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl shadow-lg w-80 space-y-4">
        <h2 className="text-xl font-semibold text-indigo-600 text-center">Sign In</h2>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={inputClass}
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={inputClass}
          required
        />
        <button type="submit" className={btnClass}>
          Sign In
        </button>
        <p className="text-center text-sm text-slate-500">
        Don't have an account? <Link to="/signup" className="text-indigo-600 font-medium hover:underline">Create one</Link>
        </p>
      </form>
    </div>
  );
}
