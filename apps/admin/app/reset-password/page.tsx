'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { createClient } from '../lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { AlertCircle, CheckCircle } from 'lucide-react';

function ResetPasswordForm() {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    void supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) { setSessionReady(true); }
      else { setError('Reset link is invalid or has expired. Please request a new one.'); }
    });
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) { setError('Passwords do not match.'); return; }
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return; }
    setLoading(true); setError(null);
    const supabase = createClient();
    const { error: updateError } = await supabase.auth.updateUser({ password });
    if (updateError) { setError(updateError.message); setLoading(false); return; }
    setDone(true);
  }

  if (done) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4 py-10">
        <Card className="w-full max-w-[420px] shadow-lg">
          <CardHeader className="items-center text-center pb-2">
            <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center text-primary-foreground font-black text-2xl mb-3">G</div>
            <h1 className="text-xl font-bold">Password updated</h1>
            <p className="text-sm text-muted-foreground mt-1">Your password has been changed successfully</p>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="flex items-start gap-2 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 px-3 py-2.5 text-sm mb-4">
              <CheckCircle size={15} className="mt-0.5 shrink-0" />
              You can now sign in with your new password.
            </div>
            <Button asChild className="w-full"><Link href="/login">Go to sign in</Link></Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!sessionReady && !error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground text-sm">Verifying reset link…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-10">
      <Card className="w-full max-w-[420px] shadow-lg">
        <CardHeader className="items-center text-center pb-2">
          <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center text-primary-foreground font-black text-2xl mb-3">G</div>
          <h1 className="text-xl font-bold">Set new password</h1>
          <p className="text-sm text-muted-foreground mt-1">Choose a strong password for your account</p>
        </CardHeader>
        <CardContent className="pt-4">
          {error && (
            <div className="flex items-start gap-2 rounded-lg bg-destructive/10 text-destructive px-3 py-2.5 text-sm mb-4">
              <AlertCircle size={15} className="mt-0.5 shrink-0" />
              <span>{error}{!sessionReady && <> <Link href="/forgot-password" className="font-semibold underline">Request a new link</Link></>}</span>
            </div>
          )}
          {sessionReady && (
            <form className="grid gap-4" onSubmit={(e) => { void onSubmit(e); }}>
              <div className="grid gap-1.5">
                <Label htmlFor="password">New password</Label>
                <Input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Min. 8 characters" required autoFocus autoComplete="new-password" minLength={8} />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="confirm">Confirm new password</Label>
                <Input id="confirm" type="password" value={confirm} onChange={e => setConfirm(e.target.value)} placeholder="Repeat password" required autoComplete="new-password" />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Updating…' : 'Update password'}
              </Button>
            </form>
          )}
          <p className="mt-5 text-center text-sm">
            <Link href="/login" className="font-semibold text-foreground hover:underline">Back to sign in</Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-background"><p className="text-muted-foreground text-sm">Loading…</p></div>}>
      <ResetPasswordForm />
    </Suspense>
  );
}
