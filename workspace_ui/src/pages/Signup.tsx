import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { Heading } from './Heading';
import { Link } from 'react-router-dom';

/** New account: name, email, password. We send a confirmation email when sign-up succeeds. */
export default function Signup() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      alert("Passwords do not match");
      return;
    }
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: {
        first_name: firstName,
        last_name: lastName,
      } },
    });
    if (error) {
      console.error("Signup error:", error.message);
      alert("Signup failed: " + error.message);
    } else {
      console.log("Signup successful:", data);
      alert("Signup successful!");
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
        
        <h2 className="text-xl font-semibold text-indigo-600 text-center">Create Account</h2>
        <input
          type="text"
          placeholder="First Name"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          className={inputClass}
          required
        />
        <input
          type="text"
          placeholder="Last Name"
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
          className={inputClass}
          required
        />
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
          required
          className={inputClass}
        />
        <input
          type="password"
          placeholder="Confirm Password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className={inputClass}
          required
        />
        <button type="submit" className={btnClass}>
          Sign Up
        </button>
        
        <p className="text-center text-sm text-slate-500">Already have an account? <Link to="/login" className="text-indigo-600 font-medium hover:underline">Sign in</Link></p>
      </form>
    </div>
  );
}
