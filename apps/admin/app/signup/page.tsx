'use client';

import { useState, Suspense } from 'react';
import Link from 'next/link';
import { createClient } from '../lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { AlertCircle, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

function SignUpForm() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [role, setRole] = useState<'admin' | 'customer'>('admin');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) { setError('Passwords do not match.'); return; }
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return; }
    setLoading(true); setError(null);
    const supabase = createClient();
    const { error: signUpError } = await supabase.auth.signUp({
      email, password,
      options: {
        data: { role, full_name: fullName },
        emailRedirectTo: `${window.location.origin}/auth/callback?next=/dashboard`,
      },
    });
    if (signUpError) { setError(signUpError.message); setLoading(false); return; }
    setDone(true);
  }

  if (done) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4 py-10">
        <Card className="w-full max-w-[420px] shadow-lg">
          <CardHeader className="items-center text-center pb-2">
            <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center text-primary-foreground font-black text-2xl mb-3">G</div>
            <h1 className="text-xl font-bold">Check your email</h1>
            <p className="text-sm text-muted-foreground mt-1">We sent a confirmation link to <strong>{email}</strong></p>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="flex items-start gap-2 rounded-lg bg-blue-50 text-blue-800 border border-blue-200 px-3 py-2.5 text-sm mb-4">
              <Info size={15} className="mt-0.5 shrink-0" />
              Click the link in the email to verify your account. Once confirmed you can sign in{role === 'admin' ? ' with admin access.' : '.'}
            </div>
            <p className="text-center text-sm text-muted-foreground">
              Already confirmed?{' '}
              <Link href="/login" className="font-semibold text-foreground hover:underline">Sign in</Link>
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
          <h1 className="text-xl font-bold">Create account</h1>
          <p className="text-sm text-muted-foreground mt-1">Join GDF Admin</p>
        </CardHeader>
        <CardContent className="pt-4">
          {error && (
            <div className="flex items-start gap-2 rounded-lg bg-destructive/10 text-destructive px-3 py-2.5 text-sm mb-4">
              <AlertCircle size={15} className="mt-0.5 shrink-0" />{error}
            </div>
          )}
          <form className="grid gap-4" onSubmit={(e) => { void onSubmit(e); }}>
            <div className="grid gap-1.5">
              <Label htmlFor="fullname">Full name</Label>
              <Input id="fullname" type="text" value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Your name" required autoFocus autoComplete="name" />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="email">Email address</Label>
              <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" required autoComplete="email" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Min. 8 chars" required autoComplete="new-password" minLength={8} />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="confirm">Confirm</Label>
                <Input id="confirm" type="password" value={confirm} onChange={e => setConfirm(e.target.value)} placeholder="Repeat" required autoComplete="new-password" />
              </div>
            </div>
            {/* Role selector */}
            <div className="grid gap-1.5">
              <Label>Account type</Label>
              <div className="grid grid-cols-2 gap-2">
                {(['admin', 'customer'] as const).map(r => (
                  <button key={r} type="button" onClick={() => setRole(r)}
                    className={cn(
                      'flex flex-col items-center gap-1 p-3 rounded-lg border-2 text-sm font-medium transition-colors cursor-pointer',
                      role === r ? 'border-primary bg-accent text-accent-foreground' : 'border-border text-muted-foreground hover:border-primary/50 hover:bg-accent/50'
                    )}>
                    <span className="text-xl">{r === 'admin' ? '🛡️' : '👤'}</span>
                    <span className="capitalize font-semibold">{r}</span>
                    <span className="text-[11px] font-normal text-muted-foreground">{r === 'admin' ? 'Full access' : 'Store access only'}</span>
                  </button>
                ))}
              </div>
            </div>
            <Button type="submit" className="w-full mt-1" disabled={loading}>
              {loading ? 'Creating account…' : 'Create account'}
            </Button>
          </form>
          <p className="mt-5 text-center text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link href="/login" className="font-semibold text-foreground hover:underline">Sign in</Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

export default function SignUpPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-background"><p className="text-muted-foreground text-sm">Loading…</p></div>}>
      <SignUpForm />
    </Suspense>
  );
}
