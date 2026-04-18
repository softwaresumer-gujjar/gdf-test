'use client';

import { useEffect, useState, type ChangeEvent } from 'react';
import Link from 'next/link';
import type { LocationOption } from '@packages/types';
import { fallbackLocations } from '../../lib/fallback-data';
import { createClient } from '../../lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

type CartItem = { productId: string; quantity: number; };

const legacyProductIdMap: Record<string, string> = { fp1: 'p1', fp2: 'p2', fp3: 'p3' };

export function CheckoutClient() {
  const [email, setEmail] = useState('customer@example.com');
  const [locationId, setLocationId] = useState('karachi-dha');
  const [locations, setLocations] = useState<LocationOption[]>(fallbackLocations);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userSignedIn, setUserSignedIn] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    void supabase.auth.getUser().then(({ data: { user } }) => {
      if (user?.email) { setEmail(user.email); setUserSignedIn(true); }
    });
  }, []);

  useEffect(() => {
    let mounted = true;
    async function loadLocations() {
      try {
        const response = await fetch(`${apiUrl}/locations`);
        if (!response.ok) return;
        const data = (await response.json()) as LocationOption[];
        if (!mounted) return;
        if (data.length) {
          setLocations(data);
          setLocationId(cur => data.some(l => l.id === cur) ? cur : data[0].id);
        }
      } catch { /* keep fallback */ }
    }
    void loadLocations();
    return () => { mounted = false; };
  }, []);

  async function onCheckout() {
    setLoading(true); setError(null);
    try {
      const itemsRaw = window.localStorage.getItem('gdf_cart');
      const items = itemsRaw
        ? (JSON.parse(itemsRaw) as CartItem[]).map(item => ({
            ...item, productId: legacyProductIdMap[item.productId] ?? item.productId
          }))
        : [];
      if (!items.length) throw new Error('Your cart is empty. Add at least one product before checkout.');

      const response = await fetch(`${apiUrl}/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items, locationId, customerEmail: email })
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string | { formErrors?: string[] } } | null;
        const formError = typeof payload?.error === 'object' ? payload.error.formErrors?.[0] : undefined;
        const msg = typeof payload?.error === 'string' ? payload.error : formError;
        throw new Error(msg ?? `Checkout failed (HTTP ${response.status})`);
      }

      const data = (await response.json()) as { url?: string };
      if (!data.url) throw new Error('Checkout URL missing');
      window.location.href = data.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardContent className="p-6 grid gap-5">
        {!userSignedIn && (
          <p className="text-sm text-muted-foreground">
            <Link href="/login?next=/checkout" className="text-primary font-semibold hover:underline">Sign in</Link>
            {' '}or{' '}
            <Link href="/signup" className="text-primary font-semibold hover:underline">create account</Link>
            {' '}to track your orders. You can also checkout as a guest below.
          </p>
        )}

        <div className="grid gap-1.5">
          <Label>Customer email</Label>
          <Input type="email" value={email}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)} />
        </div>

        <div className="grid gap-1.5">
          <Label>Delivery location</Label>
          <select title="Delivery location"
            className="flex h-9 w-full rounded-lg border border-input bg-card px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            value={locationId}
            onChange={(e: ChangeEvent<HTMLSelectElement>) => setLocationId(e.target.value)}>
            {locations.map(loc => (
              <option key={loc.id} value={loc.id}>{loc.city} — {loc.area}</option>
            ))}
          </select>
        </div>

        {error && (
          <div className="flex items-start gap-2 rounded-lg bg-red-50 text-red-700 px-3 py-2.5 text-sm">
            <AlertCircle size={14} className="mt-0.5 shrink-0" />{error}
          </div>
        )}

        <Button disabled={loading} onClick={() => void onCheckout()} className="w-full" size="lg">
          {loading ? 'Processing…' : 'Pay now'}
        </Button>
      </CardContent>
    </Card>
  );
}
