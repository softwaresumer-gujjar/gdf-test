'use client';

import { useState, type FormEvent, Suspense } from 'react';
import Link from 'next/link';
import { createClient } from '../lib/supabase/client';

function ForgotPasswordForm() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
    });

    if (resetError) {
      setError(resetError.message);
      setLoading(false);
      return;
    }

    setSent(true);
  }

  if (sent) {
    return (
      <main className="auth-page">
        <div className="card auth-page__card">
          <div className="auth-page__brand">
            <div className="auth-page__logo">G</div>
            <h1 className="auth-page__title">Check your email</h1>
            <p className="auth-page__subtitle">We sent a reset link to <strong>{email}</strong></p>
          </div>
          <div className="auth-page__alert auth-page__alert--info">
            Click the link in the email to set a new password. The link expires in 1 hour.
          </div>
          <div className="auth-page__links">
            <span>
              <Link href="/login" className="auth-page__link">Back to sign in</Link>
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
          <h1 className="auth-page__title">Forgot password?</h1>
          <p className="auth-page__subtitle">
            Enter your email and we&apos;ll send you a reset link
          </p>
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

          <button type="submit" className="button auth-page__submit" disabled={loading}>
            {loading ? 'Sending…' : 'Send reset link'}
          </button>
        </form>

        <div className="auth-page__links">
          <span>
            <Link href="/login" className="auth-page__link">Back to sign in</Link>
          </span>
        </div>
      </div>
    </main>
  );
}

export default function ForgotPasswordPage() {
  return (
    <Suspense fallback={
      <main className="auth-page">
        <p className="auth-page__spinner">Loading…</p>
      </main>
    }>
      <ForgotPasswordForm />
    </Suspense>
  );
}
