'use client';

import { Suspense, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '../lib/supabase/client';

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

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password });

    if (authError) {
      setError(authError.message);
      setLoading(false);
    } else {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      router.push(nextPath as any);
      router.refresh();
    }
  }

  return (
    <main className="container center" style={{ paddingTop: 60 }}>
      <div className="card" style={{ maxWidth: 400, margin: '0 auto', padding: 32 }}>
        <h1 style={{ marginTop: 0 }}>Sign in</h1>

        {error && (
          <div style={{ background: '#fee2e2', color: '#991b1b', padding: '10px 14px', borderRadius: 6, marginBottom: 16 }}>
            {error}
          </div>
        )}

        <form onSubmit={(e) => { void onSubmit(e); }} style={{ display: 'grid', gap: 14 }}>
          <label style={{ display: 'grid', gap: 4 }}>
            Email
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="you@example.com"
            />
          </label>

          <label style={{ display: 'grid', gap: 4 }}>
            Password
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
            />
          </label>

          <button type="submit" className="button" disabled={loading}>
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <p style={{ marginTop: 20, textAlign: 'center', fontSize: 14 }}>
          New customer?{' '}
          <Link href="/signup" style={{ color: 'var(--color-brand)' }}>Create account</Link>
        </p>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
