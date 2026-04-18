'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '../lib/supabase/client';

export default function SignupPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName, role: 'customer' }
      }
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
    } else {
      setSuccess(true);
    }
  }

  if (success) {
    return (
      <main className="container center" style={{ paddingTop: 60 }}>
        <div className="card" style={{ maxWidth: 400, margin: '0 auto', padding: 32, textAlign: 'center' }}>
          <h1 style={{ marginTop: 0 }}>Check your email ✉️</h1>
          <p>We sent a confirmation link to <strong>{email}</strong>. Click it to activate your account, then sign in.</p>
          <Link href="/login" className="button" style={{ marginTop: 16, display: 'inline-block' }}>Go to sign in</Link>
        </div>
      </main>
    );
  }

  return (
    <main className="container center" style={{ paddingTop: 60 }}>
      <div className="card" style={{ maxWidth: 400, margin: '0 auto', padding: 32 }}>
        <h1 style={{ marginTop: 0 }}>Create account</h1>

        {error && (
          <div style={{ background: '#fee2e2', color: '#991b1b', padding: '10px 14px', borderRadius: 6, marginBottom: 16 }}>
            {error}
          </div>
        )}

        <form onSubmit={(e) => { void onSubmit(e); }} style={{ display: 'grid', gap: 14 }}>
          <label style={{ display: 'grid', gap: 4 }}>
            Full name
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              placeholder="Wasif Gujjar"
            />
          </label>

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
              minLength={6}
              placeholder="min. 6 characters"
            />
          </label>

          <button type="submit" className="button" disabled={loading}>
            {loading ? 'Creating account…' : 'Create account'}
          </button>
        </form>

        <p style={{ marginTop: 20, textAlign: 'center', fontSize: 14 }}>
          Already have an account?{' '}
          <Link href="/login" style={{ color: 'var(--color-brand)' }}>Sign in</Link>
        </p>
      </div>
    </main>
  );
}
