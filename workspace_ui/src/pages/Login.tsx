import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { Heading } from './Heading';
import { Link, useNavigate } from 'react-router-dom';

/** Sign-in page: email and password, then go to the home screen if it works. */
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
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      {/* light blue rounded background box */}
      <div className="relative w-full max-w-7xl min-h-[700px]">
        <div className="absolute inset-0 bg-blue-100 rounded-[32px]"></div>

        <div className="relative flex flex-col items-center justify-center p-10">
          <div className="mb-25">
            <Heading />
            <p className="mt-2 text-center text-base font-medium text-indigo-600">
              Manage your teams &amp; resources
            </p>
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
              {/* Password Input & Forgot Password Link */}
              <div className="space-y-1">
                  <input
                      type="password"
                      placeholder="Password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className={inputClass}
                      required
                  />
                  <div className="flex justify-end">
                      <Link to="/reset-password" className="text-xs font-medium text-indigo-600 hover:text-indigo-700 hover:underline">
                          Forgot your password?
                      </Link>
                  </div>
              </div>


              <button type="submit" className={btnClass}>
              Sign In
            </button>

            <p className="text-center text-sm text-slate-500">
              Don't have an account?{" "}
              <Link to="/signup" className="text-indigo-600 font-medium hover:underline">
                Create one
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
