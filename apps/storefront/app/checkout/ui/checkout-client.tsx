'use client';

import { useEffect, useState, type ChangeEvent } from 'react';
import Link from 'next/link';
import type { LocationOption } from '@packages/types';
import { fallbackLocations } from '../../lib/fallback-data';
import { createClient } from '../../lib/supabase/client';

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

type CartItem = {
  productId: string;
  quantity: number;
};

const legacyProductIdMap: Record<string, string> = {
  fp1: 'p1',
  fp2: 'p2',
  fp3: 'p3'
};

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
      if (user?.email) {
        setEmail(user.email);
        setUserSignedIn(true);
      }
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
          setLocationId((currentLocationId) => (
            data.some((location) => location.id === currentLocationId)
              ? currentLocationId
              : data[0].id
          ));
        }
      } catch {
        // keep fallback locations
      }
    }

    void loadLocations();
    return () => {
      mounted = false;
    };
  }, []);

  async function onCheckout() {
    setLoading(true);
    setError(null);

    try {
      const itemsRaw = window.localStorage.getItem('milkman_cart');
      const items = itemsRaw
        ? (JSON.parse(itemsRaw) as CartItem[]).map((item) => ({
          ...item,
          productId: legacyProductIdMap[item.productId] ?? item.productId
        }))
        : [];

      if (!items.length) {
        throw new Error('Your cart is empty. Add at least one product before checkout.');
      }

      const response = await fetch(`${apiUrl}/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items, locationId, customerEmail: email })
      });

      if (!response.ok) {
        const errorPayload = (await response.json().catch(() => null)) as
          | { error?: string | { formErrors?: string[] } }
          | null;

        const formError = typeof errorPayload?.error === 'object'
          ? errorPayload.error.formErrors?.[0]
          : undefined;
        const errorMessage = typeof errorPayload?.error === 'string'
          ? errorPayload.error
          : formError;

        throw new Error(errorMessage ?? `Checkout failed (HTTP ${response.status})`);
      }

      const data = (await response.json()) as { url?: string };
      if (!data.url) {
        throw new Error('Checkout URL missing');
      }

      window.location.href = data.url;
    } catch (checkoutError) {
      setError(checkoutError instanceof Error ? checkoutError.message : 'Unknown error');
      setLoading(false);
    }
  }

  return (
    <div className="card" style={{ padding: 20, maxWidth: 520 }}>
      {!userSignedIn && (
        <p style={{ fontSize: 13, color: '#6b7280', marginTop: 0, marginBottom: 14 }}>
          <Link href="/login?next=/checkout" style={{ color: 'var(--color-brand)', fontWeight: 600 }}>Sign in</Link>
          {' '}or{' '}
          <Link href="/signup" style={{ color: 'var(--color-brand)', fontWeight: 600 }}>create account</Link>
          {' '}to track your orders. You can also checkout as a guest below.
        </p>
      )}

      <label style={{ display: 'grid', gap: 6, marginBottom: 10 }}>
        Customer email
        <input
          value={email}
          onChange={(event: ChangeEvent<HTMLInputElement>) => setEmail(event.target.value)}
          style={{ padding: 10, borderRadius: 8, border: '1px solid #d0d7e5' }}
        />
      </label>

      <label style={{ display: 'grid', gap: 6, marginBottom: 12 }}>
        Location
        <select
          value={locationId}
          onChange={(event: ChangeEvent<HTMLSelectElement>) => setLocationId(event.target.value)}
          style={{ padding: 10, borderRadius: 8, border: '1px solid #d0d7e5' }}
        >
          {locations.map((location) => (
            <option key={location.id} value={location.id}>
              {location.city} - {location.area}
            </option>
          ))}
        </select>
      </label>

      {error ? <p style={{ color: 'crimson' }}>{error}</p> : null}

      <button className="button" disabled={loading} onClick={onCheckout}>
        {loading ? 'Processing...' : 'Pay now'}
      </button>
    </div>
  );
}
