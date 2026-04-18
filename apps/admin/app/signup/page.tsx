'use client';

import { useState, type FormEvent, Suspense } from 'react';
import Link from 'next/link';
import { createClient } from '../lib/supabase/client';

function SignUpForm() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [role, setRole] = useState<'admin' | 'customer'>('admin');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    setLoading(true);
    setError(null);

    const supabase = createClient();

    // Pass role + full_name in user metadata — the DB trigger reads these
    // to populate the profiles table on first sign-up.
    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { role, full_name: fullName },
        emailRedirectTo: `${window.location.origin}/auth/callback?next=/dashboard`,
      },
    });

    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
      return;
    }

    setDone(true);
  }

  if (done) {
    return (
      <main className="auth-page">
        <div className="card auth-page__card">
          <div className="auth-page__brand">
            <div className="auth-page__logo">G</div>
            <h1 className="auth-page__title">Check your email</h1>
            <p className="auth-page__subtitle">We sent a confirmation link to <strong>{email}</strong></p>
          </div>
          <div className="auth-page__alert auth-page__alert--info">
            Click the link in the email to verify your account. Once confirmed you can sign in
            {role === 'admin' ? ' with admin access.' : '.'}
          </div>
          <div className="auth-page__links">
            <span>
              Already confirmed?{' '}
              <Link href="/login" className="auth-page__link">Sign in</Link>
            </span>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="auth-page">
      <div className="card auth-page__card">
        <div className="auth-page__brand">
          <div className="auth-page__logo">G</div>
          <h1 className="auth-page__title">Create account</h1>
          <p className="auth-page__subtitle">Join GDF Admin</p>
        </div>

        {error && <div className="auth-page__alert auth-page__alert--error">{error}</div>}

        <form className="auth-page__form" onSubmit={(e) => { void onSubmit(e); }}>
          <label className="auth-page__field">
            Full name
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Your name"
              required
              autoFocus
              autoComplete="name"
            />
          </label>

          <label className="auth-page__field">
            Email address
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              autoComplete="email"
            />
          </label>

          <label className="auth-page__field">
            Password
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Min. 8 characters"
              required
              autoComplete="new-password"
              minLength={8}
            />
          </label>

          <label className="auth-page__field">
            Confirm password
            <input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="Repeat password"
              required
              autoComplete="new-password"
            />
          </label>

          {/* Role selection */}
          <div className="auth-page__field">
            <span style={{ fontSize: 14, fontWeight: 500, color: '#374151' }}>Account type</span>
            <div className="role-selector">
              <label className="role-option">
                <input
                  type="radio"
                  name="role"
                  value="admin"
                  checked={role === 'admin'}
                  onChange={() => setRole('admin')}
                />
                <span className="role-option__label">
                  <span className="role-option__icon">🛡️</span>
                  Admin
                  <span className="role-option__note">Full access</span>
                </span>
              </label>
              <label className="role-option">
                <input
                  type="radio"
                  name="role"
                  value="customer"
                  checked={role === 'customer'}
                  onChange={() => setRole('customer')}
                />
                <span className="role-option__label">
                  <span className="role-option__icon">👤</span>
                  Customer
                  <span className="role-option__note">Store access only</span>
                </span>
              </label>
            </div>
          </div>

          <button type="submit" className="button auth-page__submit" disabled={loading}>
            {loading ? 'Creating account…' : 'Create account'}
          </button>
        </form>

        <div className="auth-page__links">
          <span>
            Already have an account?{' '}
            <Link href="/login" className="auth-page__link">Sign in</Link>
          </span>
        </div>
      </div>
    </main>
  );
}

export default function SignUpPage() {
  return (
    <Suspense fallback={
      <main className="auth-page">
        <p className="auth-page__spinner">Loading…</p>
      </main>
    }>
      <SignUpForm />
    </Suspense>
  );
}
