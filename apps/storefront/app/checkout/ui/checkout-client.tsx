'use client';

import { useEffect, useState, type ChangeEvent } from 'react';
import Link from 'next/link';
import type { LocationOption } from '@packages/types';
import { fallbackLocations } from '../../lib/fallback-data';
import { createClient } from '../../lib/supabase/client';
import { AlertCircle, ShoppingCart } from 'lucide-react';

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

type CartItem = { productId: string; quantity: number; };
const legacyMap: Record<string, string> = { fp1: 'p1', fp2: 'p2', fp3: 'p3' };

export function CheckoutClient() {
  const [email, setEmail] = useState('customer@example.com');
  const [locationId, setLocationId] = useState('karachi-dha');
  const [locations, setLocations] = useState<LocationOption[]>(fallbackLocations);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userSignedIn, setUserSignedIn] = useState(false);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);

  useEffect(() => {
    const supabase = createClient();
    void supabase.auth.getUser().then(({ data: { user } }) => {
      if (user?.email) { setEmail(user.email); setUserSignedIn(true); }
    });

    const raw = localStorage.getItem('gdf_cart');
    if (raw) setCartItems(JSON.parse(raw) as CartItem[]);
  }, []);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const res = await fetch(`${apiUrl}/locations`);
        if (!res.ok) return;
        const data = (await res.json()) as LocationOption[];
        if (!mounted || !data.length) return;
        setLocations(data);
        setLocationId(cur => data.some(l => l.id === cur) ? cur : data[0].id);
      } catch { /* keep fallback */ }
    }
    void load();
    return () => { mounted = false; };
  }, []);

  async function onCheckout() {
    setLoading(true); setError(null);
    try {
      const items = cartItems.map(i => ({ ...i, productId: legacyMap[i.productId] ?? i.productId }));
      if (!items.length) throw new Error('Your cart is empty. Add at least one product before checkout.');

      const res = await fetch(`${apiUrl}/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items, locationId, customerEmail: email }),
      });

      if (!res.ok) {
        const payload = (await res.json().catch(() => null)) as { error?: string | { formErrors?: string[] } } | null;
        const msg = typeof payload?.error === 'string'
          ? payload.error
          : typeof payload?.error === 'object' ? payload.error.formErrors?.[0] : undefined;
        throw new Error(msg ?? `Checkout failed (HTTP ${res.status})`);
      }

      const data = (await res.json()) as { url?: string };
      if (!data.url) throw new Error('Checkout URL missing');
      window.location.href = data.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      setLoading(false);
    }
  }

  return (
    <div className="grid gap-5">
      {!userSignedIn && (
        <p className="text-sm text-gray-400 bg-gray-50 rounded-xl px-4 py-3">
          <Link href="/login?next=/checkout" className="text-primary font-bold hover:underline">Sign in</Link>
          {' '}or{' '}
          <Link href="/signup" className="text-primary font-bold hover:underline">create account</Link>
          {' '}to track orders. Or checkout as guest below.
        </p>
      )}

      {cartItems.length > 0 && (
        <div className="bg-gray-50 rounded-xl p-4">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">Cart ({cartItems.length} item{cartItems.length !== 1 ? 's' : ''})</p>
          <div className="grid gap-2">
            {cartItems.map(item => (
              <div key={item.productId} className="flex justify-between text-sm">
                <span className="text-gray-600 font-mono text-xs">{item.productId.slice(0, 8)}</span>
                <span className="font-semibold text-gray-700">×{item.quantity}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid gap-1.5">
        <label className="text-xs font-semibold text-gray-600">Customer email</label>
        <input type="email" value={email} title="Customer email" placeholder="you@example.com"
          onChange={(e: ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
          className="w-full h-10 px-3.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors" />
      </div>

      <div className="grid gap-1.5">
        <label className="text-xs font-semibold text-gray-600">Delivery location</label>
        <select title="Delivery location" value={locationId}
          onChange={(e: ChangeEvent<HTMLSelectElement>) => setLocationId(e.target.value)}
          className="w-full h-10 px-3.5 rounded-xl border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors">
          {locations.map(loc => (
            <option key={loc.id} value={loc.id}>{loc.city} — {loc.area}</option>
          ))}
        </select>
      </div>

      {error && (
        <div className="flex items-start gap-2 rounded-xl bg-red-50 text-red-600 px-3 py-2.5 text-sm">
          <AlertCircle size={14} className="mt-0.5 shrink-0" />{error}
        </div>
      )}

      <button
        type="button"
        disabled={loading}
        onClick={() => void onCheckout()}
        className="w-full h-12 bg-primary text-white font-bold rounded-full hover:bg-primary/90 active:scale-[0.98] transition-all disabled:opacity-60 flex items-center justify-center gap-2 text-sm"
      >
        <ShoppingCart size={17} />
        {loading ? 'Processing…' : 'Pay now'}
      </button>
    </div>
  );
}
