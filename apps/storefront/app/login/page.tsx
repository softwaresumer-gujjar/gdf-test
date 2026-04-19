'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '../lib/supabase/client';
import { AlertCircle } from 'lucide-react';
import { PageHeader } from '../ui/page-header';
import { Footer } from '../ui/footer';

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
    <div className="min-h-screen bg-background flex flex-col">
      <PageHeader />
      <div className="flex-1 flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-sm bg-card border border-border rounded-lg shadow-sm p-7">
          <div className="text-center mb-6">
            <img src="/logo.svg" alt="Gujjar Dairy Farmers" className="h-14 w-14 rounded-lg mx-auto mb-3" />
            <h1 className="text-xl font-bold">Sign in</h1>
            <p className="text-sm text-muted-foreground mt-1">Welcome back to Gujjar Dairy Farmers</p>
          </div>

          {error && (
            <div className="flex items-start gap-2 rounded-lg bg-destructive/10 text-destructive px-3 py-2.5 text-sm mb-5 border border-destructive/20">
              <AlertCircle size={14} className="mt-0.5 shrink-0" />{error}
            </div>
          )}

          <form onSubmit={(e) => { e.preventDefault(); void onSubmit(); }} className="grid gap-4">
            <div className="grid gap-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
                placeholder="you@example.com"
                className="w-full h-10 px-3.5 rounded-lg border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors" />
            </div>
            <div className="grid gap-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Password</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required
                placeholder="••••••••"
                className="w-full h-10 px-3.5 rounded-lg border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors" />
            </div>
            <button type="submit" disabled={loading}
              className="w-full h-11 bg-primary text-primary-foreground font-semibold rounded-lg hover:bg-primary/90 active:scale-[0.98] transition-all disabled:opacity-60 mt-1">
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-6">
            New customer?{' '}
            <Link href="/signup" className="text-primary font-semibold hover:underline">Create account</Link>
          </p>
        </div>
      </div>
      <Footer />
    </div>
  );
}

export default function LoginPage() {
  return <Suspense><LoginForm /></Suspense>;
}
