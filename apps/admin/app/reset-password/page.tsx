'use client';

import { useState, useEffect, type FormEvent, Suspense } from 'react';
import Link from 'next/link';
import { createClient } from '../lib/supabase/client';

function ResetPasswordForm() {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);

  // The auth callback already exchanged the reset code for a session.
  // Verify the session is present before showing the form.
  useEffect(() => {
    const supabase = createClient();
    void supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setSessionReady(true);
      } else {
        setError('Reset link is invalid or has expired. Please request a new one.');
      }
    });
  }, []);

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
    const { error: updateError } = await supabase.auth.updateUser({ password });

    if (updateError) {
      setError(updateError.message);
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
            <h1 className="auth-page__title">Password updated</h1>
            <p className="auth-page__subtitle">Your password has been changed successfully</p>
          </div>
          <div className="auth-page__alert auth-page__alert--success">
            You can now sign in with your new password.
          </div>
          <div className="auth-page__links">
            <Link href="/login" className="button auth-page__submit" style={{ textAlign: 'center' }}>
              Go to sign in
            </Link>
          </div>
        </div>
      </main>
    );
  }

  if (!sessionReady && !error) {
    return (
      <main className="auth-page">
        <p className="auth-page__spinner">Verifying reset link…</p>
      </main>
    );
  }

  return (
    <main className="auth-page">
      <div className="card auth-page__card">
        <div className="auth-page__brand">
          <div className="auth-page__logo">G</div>
          <h1 className="auth-page__title">Set new password</h1>
          <p className="auth-page__subtitle">Choose a strong password for your account</p>
        </div>

        {error && (
          <div className="auth-page__alert auth-page__alert--error">
            {error}{' '}
            {!sessionReady && (
              <Link href="/forgot-password" className="auth-page__link">
                Request a new link
              </Link>
            )}
          </div>
        )}

        {sessionReady && (
          <form className="auth-page__form" onSubmit={(e) => { void onSubmit(e); }}>
            <label className="auth-page__field">
              New password
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min. 8 characters"
                required
                autoFocus
                autoComplete="new-password"
                minLength={8}
              />
            </label>

            <label className="auth-page__field">
              Confirm new password
              <input
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="Repeat password"
                required
                autoComplete="new-password"
              />
            </label>

            <button type="submit" className="button auth-page__submit" disabled={loading}>
              {loading ? 'Updating…' : 'Update password'}
            </button>
          </form>
        )}

        <div className="auth-page__links">
          <span>
            <Link href="/login" className="auth-page__link">Back to sign in</Link>
          </span>
        </div>
      </div>
    </main>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <main className="auth-page">
        <p className="auth-page__spinner">Loading…</p>
      </main>
    }>
      <ResetPasswordForm />
    </Suspense>
  );
}
