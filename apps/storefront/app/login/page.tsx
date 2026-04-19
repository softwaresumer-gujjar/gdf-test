'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '../lib/supabase/client';
import { AlertCircle } from 'lucide-react';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = searchParams.get('next') ?? '/';
  const errorParam = searchParams.get('error');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(
    errorParam === 'not_admin' ? 'Access denied — admin account required.' : null
  );

  async function onSubmit() {
    setLoading(true); setError(null);
    const supabase = createClient();
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
    if (authError) { setError(authError.message); setLoading(false); }
    else { router.push(nextPath); router.refresh(); }
  }

  return (
    <div className="min-h-screen bg-brand-gradient flex flex-col">
      <header className="px-5 py-4">
        <Link href="/">
          <img src="/logo.svg" alt="Gujjar Dairy Farmers" className="h-10 w-10 rounded-xl shadow-lg" />
        </Link>
      </header>
      <div className="flex-1 flex items-center justify-center px-4 pb-10">
        <div className="w-full max-w-sm bg-white rounded-3xl shadow-2xl p-7">
          <div className="text-center mb-7">
            <img src="/logo.svg" alt="Gujjar Dairy Farmers" className="h-14 w-14 rounded-2xl mx-auto mb-3 shadow" />
            <h1 className="text-xl font-bold text-gray-800">Sign in</h1>
            <p className="text-sm text-gray-400 mt-1">Welcome back to Gujjar Dairy Farmers</p>
          </div>

          {error && (
            <div className="flex items-start gap-2 rounded-xl bg-red-50 text-red-600 px-3 py-2.5 text-sm mb-5">
              <AlertCircle size={14} className="mt-0.5 shrink-0" />{error}
            </div>
          )}

          <form onSubmit={e => { e.preventDefault(); void onSubmit(); }} className="grid gap-4">
            <div className="grid gap-1.5">
              <label className="text-xs font-semibold text-gray-600">Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
                placeholder="you@example.com"
                className="w-full h-10 px-3.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors" />
            </div>
            <div className="grid gap-1.5">
              <label className="text-xs font-semibold text-gray-600">Password</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} required
                placeholder="••••••••"
                className="w-full h-10 px-3.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors" />
            </div>
            <button type="submit" disabled={loading}
              className="w-full h-11 bg-primary text-white font-bold rounded-full hover:bg-primary/90 active:scale-[0.98] transition-all disabled:opacity-60 mt-1">
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          <p className="text-center text-sm text-gray-400 mt-6">
            New customer?{' '}
            <Link href="/signup" className="text-primary font-bold hover:underline">Create account</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return <Suspense><LoginForm /></Suspense>;
}
