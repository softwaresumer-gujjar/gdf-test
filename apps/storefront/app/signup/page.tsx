'use client';

import { useState } from 'react';
import Link from 'next/link';
import { createClient } from '../lib/supabase/client';
import { AlertCircle, Mail } from 'lucide-react';
import { PageHeader } from '../ui/page-header';
import { Footer } from '../ui/footer';

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
      <div className="min-h-screen bg-background flex flex-col">
        <PageHeader />
        <div className="flex-1 flex items-center justify-center px-4 py-10">
          <div className="w-full max-w-sm bg-card border border-border rounded-lg shadow-sm p-8 text-center">
            <div className="w-14 h-14 bg-accent rounded-lg flex items-center justify-center mx-auto mb-4">
              <Mail size={28} className="text-primary" />
            </div>
            <h1 className="text-xl font-bold mb-2">Check your email</h1>
            <p className="text-sm text-muted-foreground mb-7">
              We sent a confirmation link to <strong className="text-foreground">{email}</strong>. Click it to activate your account.
            </p>
            <Link href="/login"
              className="block w-full h-11 bg-primary text-primary-foreground font-semibold rounded-lg hover:bg-primary/90 transition-colors leading-[44px] text-center text-sm">
              Go to sign in
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <PageHeader />
      <div className="flex-1 flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-sm bg-card border border-border rounded-lg shadow-sm p-7">
          <div className="text-center mb-6">
            <img src="/logo.svg" alt="Gujjar Dairy Farmers" className="h-14 w-14 rounded-lg mx-auto mb-3" />
            <h1 className="text-xl font-bold">Create account</h1>
            <p className="text-sm text-muted-foreground mt-1">Join Gujjar Dairy Farmers</p>
          </div>

          {error && (
            <div className="flex items-start gap-2 rounded-lg bg-destructive/10 text-destructive px-3 py-2.5 text-sm mb-5 border border-destructive/20">
              <AlertCircle size={14} className="mt-0.5 shrink-0" />{error}
            </div>
          )}

          <form onSubmit={(e) => { e.preventDefault(); void onSubmit(); }} className="grid gap-4">
            <div className="grid gap-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Full name</label>
              <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} required
                placeholder="Wasif Gujjar"
                className="w-full h-10 px-3.5 rounded-lg border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors" />
            </div>
            <div className="grid gap-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
                placeholder="you@example.com"
                className="w-full h-10 px-3.5 rounded-lg border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors" />
            </div>
            <div className="grid gap-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Password</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6}
                placeholder="min. 6 characters"
                className="w-full h-10 px-3.5 rounded-lg border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors" />
            </div>
            <button type="submit" disabled={loading}
              className="w-full h-11 bg-primary text-primary-foreground font-semibold rounded-lg hover:bg-primary/90 active:scale-[0.98] transition-all disabled:opacity-60 mt-1">
              {loading ? 'Creating account…' : 'Create account'}
            </button>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-6">
            Already have an account?{' '}
            <Link href="/login" className="text-primary font-semibold hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
      <Footer />
    </div>
  );
}
