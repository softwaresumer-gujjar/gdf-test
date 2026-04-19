'use client';

import { useState } from 'react';
import Link from 'next/link';
import { createClient } from '../lib/supabase/client';
import { AlertCircle, Mail } from 'lucide-react';

export default function SignupPage() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function onSubmit() {
    setLoading(true); setError(null);
    const supabase = createClient();
    const { error: authError } = await supabase.auth.signUp({
      email, password,
      options: { data: { full_name: fullName, role: 'customer' } }
    });
    if (authError) { setError(authError.message); setLoading(false); }
    else setSuccess(true);
  }

  if (success) {
    return (
      <div className="min-h-screen bg-brand-gradient flex flex-col">
        <header className="px-5 py-4">
          <Link href="/"><img src="/logo.svg" alt="Gujjar Dairy Farmers" className="h-10 w-10 rounded-xl shadow-lg" /></Link>
        </header>
        <div className="flex-1 flex items-center justify-center px-4 pb-10">
          <div className="w-full max-w-sm bg-white rounded-3xl shadow-2xl p-8 text-center">
            <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Mail size={28} className="text-primary" />
            </div>
            <h1 className="text-xl font-bold text-gray-800 mb-2">Check your email</h1>
            <p className="text-sm text-gray-400 mb-7">
              We sent a confirmation link to <strong className="text-gray-600">{email}</strong>. Click it to activate your account.
            </p>
            <Link href="/login"
              className="block w-full h-11 bg-primary text-white font-bold rounded-full hover:bg-primary/90 transition-colors leading-[44px] text-center text-sm">
              Go to sign in
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-gradient flex flex-col">
      <header className="px-5 py-4">
        <Link href="/"><img src="/logo.svg" alt="Gujjar Dairy Farmers" className="h-10 w-10 rounded-xl shadow-lg" /></Link>
      </header>
      <div className="flex-1 flex items-center justify-center px-4 pb-10">
        <div className="w-full max-w-sm bg-white rounded-3xl shadow-2xl p-7">
          <div className="text-center mb-7">
            <img src="/logo.svg" alt="Gujjar Dairy Farmers" className="h-14 w-14 rounded-2xl mx-auto mb-3 shadow" />
            <h1 className="text-xl font-bold text-gray-800">Create account</h1>
            <p className="text-sm text-gray-400 mt-1">Join Gujjar Dairy Farmers</p>
          </div>

          {error && (
            <div className="flex items-start gap-2 rounded-xl bg-red-50 text-red-600 px-3 py-2.5 text-sm mb-5">
              <AlertCircle size={14} className="mt-0.5 shrink-0" />{error}
            </div>
          )}

          <form onSubmit={e => { e.preventDefault(); void onSubmit(); }} className="grid gap-4">
            <div className="grid gap-1.5">
              <label className="text-xs font-semibold text-gray-600">Full name</label>
              <input type="text" value={fullName} onChange={e => setFullName(e.target.value)} required
                placeholder="Wasif Gujjar"
                className="w-full h-10 px-3.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors" />
            </div>
            <div className="grid gap-1.5">
              <label className="text-xs font-semibold text-gray-600">Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
                placeholder="you@example.com"
                className="w-full h-10 px-3.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors" />
            </div>
            <div className="grid gap-1.5">
              <label className="text-xs font-semibold text-gray-600">Password</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={6}
                placeholder="min. 6 characters"
                className="w-full h-10 px-3.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors" />
            </div>
            <button type="submit" disabled={loading}
              className="w-full h-11 bg-primary text-white font-bold rounded-full hover:bg-primary/90 active:scale-[0.98] transition-all disabled:opacity-60 mt-1">
              {loading ? 'Creating account…' : 'Create account'}
            </button>
          </form>

          <p className="text-center text-sm text-gray-400 mt-6">
            Already have an account?{' '}
            <Link href="/login" className="text-primary font-bold hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
