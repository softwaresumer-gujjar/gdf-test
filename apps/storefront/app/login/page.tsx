'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '../lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';

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

  async function onSubmit() {
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password });

    if (authError) {
      setError(authError.message);
      setLoading(false);
    } else {
      router.push(nextPath);
      router.refresh();
    }
  }

  return (
    <main className="min-h-screen bg-background flex items-center justify-center px-4 py-16">
      <Card className="w-full max-w-sm">
        <CardContent className="p-7">
          <div className="text-center mb-7">
            <h1 className="text-2xl font-bold text-primary">Sign in</h1>
            <p className="text-sm text-muted-foreground mt-1">Welcome back to Gujjar Dairy Farmers</p>
          </div>

          {error && (
            <div className="flex items-start gap-2 rounded-lg bg-red-50 text-red-700 px-3 py-2.5 text-sm mb-5">
              <AlertCircle size={14} className="mt-0.5 shrink-0" />{error}
            </div>
          )}

          <form onSubmit={(e) => { e.preventDefault(); void onSubmit(); }} className="grid gap-4">
            <div className="grid gap-1.5">
              <Label>Email</Label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                required placeholder="you@example.com" />
            </div>
            <div className="grid gap-1.5">
              <Label>Password</Label>
              <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                required placeholder="••••••••" />
            </div>
            <Button type="submit" disabled={loading} className="w-full mt-1">
              {loading ? 'Signing in…' : 'Sign in'}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-6">
            New customer?{' '}
            <Link href="/signup" className="text-primary font-semibold hover:underline">Create account</Link>
          </p>
        </CardContent>
      </Card>
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
