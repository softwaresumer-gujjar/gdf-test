'use client';

import { useState, useEffect, type FormEvent, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '../lib/supabase/client';

function LoginForm() {
  const searchParams = useSearchParams();
  const nextPath = searchParams.get('next') ?? '/dashboard';
  const errorParam = searchParams.get('error');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [error, setError] = useState<string | null>(
    errorParam === 'not_admin' ? 'This account does not have admin access.' : null
  );

  // Skip login page if already authenticated as admin
  useEffect(() => {
    const supabase = createClient();
    void supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        const { data: profile } = await supabase
          .from('profiles').select('role').eq('id', session.user.id).single();
        if (profile?.role === 'admin') {
          window.location.replace('/dashboard');
          return;
        }
      }
      setChecking(false);
    });
  }, []);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    // Verify admin role before navigating
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: profile } = await supabase
        .from('profiles').select('role').eq('id', user.id).single();
      if (!profile || profile.role !== 'admin') {
        await supabase.auth.signOut();
        setError('This account does not have admin access.');
        setLoading(false);
        return;
      }
    }

    window.location.replace(nextPath);
  }

  if (checking) {
    return (
      <main className="auth-page">
        <p className="auth-page__spinner">Checking session…</p>
      </main>
    );
  }

  return (
    <main className="auth-page">
      <div className="card auth-page__card">
        <div className="auth-page__brand">
          <div className="auth-page__logo">G</div>
          <h1 className="auth-page__title">GDF Admin</h1>
          <p className="auth-page__subtitle">Sign in to your admin account</p>
        </div>

        {error && <div className="auth-page__alert auth-page__alert--error">{error}</div>}

        <form className="auth-page__form" onSubmit={(e) => { void onSubmit(e); }}>
          <label className="auth-page__field">
            Email address
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@example.com"
              required
              autoFocus
              autoComplete="email"
            />
          </label>

          <label className="auth-page__field">
            Password
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              autoComplete="current-password"
            />
          </label>

          <button type="submit" className="button auth-page__submit" disabled={loading}>
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <div className="auth-page__links">
          <span>
            <Link href="/forgot-password" className="auth-page__link">
              Forgot your password?
            </Link>
          </span>
          <span>
            Don&apos;t have an account?{' '}
            <Link href="/signup" className="auth-page__link">
              Sign up
            </Link>
          </span>
        </div>
      </div>
    </main>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense fallback={
      <main className="auth-page">
        <p className="auth-page__spinner">Loading…</p>
      </main>
    }>
      <LoginForm />
    </Suspense>
  );
}
