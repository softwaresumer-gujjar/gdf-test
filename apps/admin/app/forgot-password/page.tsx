'use client';

import { useState, Suspense } from 'react';
import Link from 'next/link';
import { createClient } from '../lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { AlertCircle, Info } from 'lucide-react';

function ForgotPasswordForm() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError(null);
    const supabase = createClient();
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
    });
    if (resetError) { setError(resetError.message); setLoading(false); return; }
    setSent(true);
  }

  if (sent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4 py-10">
        <Card className="w-full max-w-[420px] shadow-lg">
          <CardHeader className="items-center text-center pb-2">
            <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center text-primary-foreground font-black text-2xl mb-3">G</div>
            <h1 className="text-xl font-bold">Check your email</h1>
            <p className="text-sm text-muted-foreground mt-1">We sent a reset link to <strong>{email}</strong></p>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="flex items-start gap-2 rounded-lg bg-blue-50 text-blue-800 border border-blue-200 px-3 py-2.5 text-sm mb-4">
              <Info size={15} className="mt-0.5 shrink-0" />
              Click the link in the email to set a new password. The link expires in 1 hour.
            </div>
            <p className="text-center text-sm">
              <Link href="/login" className="font-semibold text-foreground hover:underline">Back to sign in</Link>
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-10">
      <Card className="w-full max-w-[420px] shadow-lg">
        <CardHeader className="items-center text-center pb-2">
          <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center text-primary-foreground font-black text-2xl mb-3">G</div>
          <h1 className="text-xl font-bold">Forgot password?</h1>
          <p className="text-sm text-muted-foreground mt-1">Enter your email and we&apos;ll send you a reset link</p>
        </CardHeader>
        <CardContent className="pt-4">
          {error && (
            <div className="flex items-start gap-2 rounded-lg bg-destructive/10 text-destructive px-3 py-2.5 text-sm mb-4">
              <AlertCircle size={15} className="mt-0.5 shrink-0" />{error}
            </div>
          )}
          <form className="grid gap-4" onSubmit={(e) => { void onSubmit(e); }}>
            <div className="grid gap-1.5">
              <Label htmlFor="email">Email address</Label>
              <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="admin@example.com" required autoFocus autoComplete="email" />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Sending…' : 'Send reset link'}
            </Button>
          </form>
          <p className="mt-5 text-center text-sm">
            <Link href="/login" className="font-semibold text-foreground hover:underline">Back to sign in</Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

export default function ForgotPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-background"><p className="text-muted-foreground text-sm">Loading…</p></div>}>
      <ForgotPasswordForm />
    </Suspense>
  );
}
