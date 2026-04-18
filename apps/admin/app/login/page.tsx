'use client';

import { useState, useEffect, type FormEvent, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '../lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';

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

  useEffect(() => {
    const supabase = createClient();
    void supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        const { data: profile } = await supabase
          .from('profiles').select('role').eq('id', session.user.id).single();
        if (profile?.role === 'admin') { window.location.replace('/dashboard'); return; }
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
    if (authError) { setError(authError.message); setLoading(false); return; }
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
      if (!profile || profile.role !== 'admin') {
        await supabase.auth.signOut();
        setError('This account does not have admin access.');
        setLoading(false); return;
      }
    }
    window.location.replace(nextPath);
  }

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground text-sm">Checking session…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-10">
      <Card className="w-full max-w-[420px] shadow-lg">
        <CardHeader className="items-center text-center pb-2">
          <img src="/logo.svg" alt="Gujjar Dairy Farmers" className="h-16 w-16 rounded-2xl mb-2" />
          <h1 className="text-xl font-bold">GDF Admin</h1>
          <p className="text-sm text-muted-foreground mt-1">Sign in to your admin account</p>
        </CardHeader>
        <CardContent className="pt-4">
          {error && (
            <div className="flex items-start gap-2 rounded-lg bg-destructive/10 text-destructive px-3 py-2.5 text-sm mb-4">
              <AlertCircle size={15} className="mt-0.5 shrink-0" />
              {error}
            </div>
          )}
          <form className="grid gap-4" onSubmit={(e) => { void onSubmit(e); }}>
            <div className="grid gap-1.5">
              <Label htmlFor="email">Email address</Label>
              <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="admin@example.com" required autoFocus autoComplete="email" />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)}
                placeholder="••••••••" required autoComplete="current-password" />
            </div>
            <Button type="submit" className="w-full mt-1" disabled={loading}>
              {loading ? 'Signing in…' : 'Sign in'}
            </Button>
          </form>
          <div className="mt-5 flex flex-col items-center gap-2 text-sm text-muted-foreground">
            <Link href="/forgot-password" className="font-semibold text-foreground hover:underline">
              Forgot your password?
            </Link>
            <span>
              Don&apos;t have an account?{' '}
              <Link href="/signup" className="font-semibold text-foreground hover:underline">Sign up</Link>
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground text-sm">Loading…</p>
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
