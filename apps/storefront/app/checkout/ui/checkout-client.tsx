'use client';

import { useEffect, useState, type ChangeEvent } from 'react';
import Link from 'next/link';
import type { LocationOption } from '@packages/types';
import { fallbackLocations } from '../../lib/fallback-data';
import { createClient } from '../../lib/supabase/client';
import { AlertCircle, ShoppingCart, Tag, X, CheckCircle } from 'lucide-react';
import { useCart } from '../../lib/cart-context';

const apiUrl = '/api';

interface AppliedCoupon {
  code: string;
  discount_percentage: number;
  title: string;
}

export function CheckoutClient() {
  const { items, cartTotal, clearCart } = useCart();
  const [email, setEmail] = useState('customer@example.com');
  const [locationId, setLocationId] = useState('karachi-dha');
  const [locations, setLocations] = useState<LocationOption[]>(fallbackLocations);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userSignedIn, setUserSignedIn] = useState(false);

  // Coupon
  const [couponInput, setCouponInput] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [appliedCoupon, setAppliedCoupon] = useState<AppliedCoupon | null>(null);

  useEffect(() => {
    const supabase = createClient();
    void supabase.auth.getUser().then(({ data: { user } }) => {
      if (user?.email) { setEmail(user.email); setUserSignedIn(true); }
    });
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
        setLocationId((cur) => data.some((l) => l.id === cur) ? cur : data[0].id);
      } catch { /* keep fallback */ }
    }
    void load();
    return () => { mounted = false; };
  }, []);

  async function applyCoupon() {
    const code = couponInput.trim().toUpperCase();
    if (!code) return;
    setCouponLoading(true);
    setCouponError(null);
    try {
      const res = await fetch(`${apiUrl}/offers/validate?code=${encodeURIComponent(code)}`);
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(body?.error ?? 'Invalid or expired code');
      }
      const data = (await res.json()) as { valid: boolean; discount_percentage: number; title: string };
      setAppliedCoupon({ code, discount_percentage: data.discount_percentage, title: data.title });
      setCouponInput('');
    } catch (err) {
      setCouponError(err instanceof Error ? err.message : 'Invalid code');
    } finally {
      setCouponLoading(false);
    }
  }

  const discountAmount = appliedCoupon
    ? Math.round(cartTotal * (appliedCoupon.discount_percentage / 100))
    : 0;
  const finalTotal = cartTotal - discountAmount;

  async function onCheckout() {
    setLoading(true); setError(null);
    try {
      if (!items.length) throw new Error('Your cart is empty. Add at least one product before checkout.');

      const res = await fetch(`${apiUrl}/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
          locationId,
          customerEmail: email,
          ...(appliedCoupon ? { couponCode: appliedCoupon.code } : {}),
        }),
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
      clearCart();
      window.location.href = data.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      setLoading(false);
    }
  }

  return (
    <div className="grid gap-5">
      {!userSignedIn && (
        <p className="text-sm text-muted-foreground bg-muted rounded-lg px-4 py-3">
          <Link href="/login?next=/checkout" className="text-primary font-semibold hover:underline">Sign in</Link>
          {' '}or{' '}
          <Link href="/signup" className="text-primary font-semibold hover:underline">create account</Link>
          {' '}to track orders. Or checkout as guest below.
        </p>
      )}

      {/* Cart summary */}
      {items.length > 0 && (
        <div className="bg-muted rounded-lg p-4">
          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-3">
            Cart ({items.length} item{items.length !== 1 ? 's' : ''})
          </p>
          <div className="grid gap-2">
            {items.map((item) => (
              <div key={item.productId} className="flex justify-between text-sm">
                <span className="text-muted-foreground">{item.name} <span className="text-muted-foreground/60">×{item.quantity}</span></span>
                <span className="font-semibold">PKR {(item.pricePkr * item.quantity).toLocaleString()}</span>
              </div>
            ))}
          </div>
          <div className="border-t border-border mt-3 pt-3 flex justify-between text-sm font-semibold">
            <span>Subtotal</span><span>PKR {cartTotal.toLocaleString()}</span>
          </div>
        </div>
      )}

      {/* Customer email */}
      <div className="grid gap-1.5">
        <label className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Customer email</label>
        <input type="email" value={email} title="Customer email" placeholder="you@example.com"
          onChange={(e: ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
          className="w-full h-10 px-3.5 rounded-lg border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors" />
      </div>

      {/* Delivery location */}
      <div className="grid gap-1.5">
        <label className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Delivery location</label>
        <select title="Delivery location" value={locationId}
          onChange={(e: ChangeEvent<HTMLSelectElement>) => setLocationId(e.target.value)}
          className="w-full h-10 px-3.5 rounded-lg border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors">
          {locations.map((loc) => (
            <option key={loc.id} value={loc.id}>{loc.city} — {loc.area}</option>
          ))}
        </select>
      </div>

      {/* Coupon code */}
      <div className="grid gap-1.5">
        <label className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Coupon Code</label>
        {appliedCoupon ? (
          <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2.5">
            <CheckCircle size={14} className="text-emerald-600 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-[12px] font-bold text-emerald-700">{appliedCoupon.code} — {appliedCoupon.title}</p>
              <p className="text-[11px] text-emerald-600">{appliedCoupon.discount_percentage}% off applied · You save PKR {discountAmount.toLocaleString()}</p>
            </div>
            <button type="button" title="Remove coupon" onClick={() => setAppliedCoupon(null)} className="text-emerald-500 hover:text-emerald-700 transition-colors">
              <X size={14} />
            </button>
          </div>
        ) : (
          <div className="flex gap-2">
            <input
              type="text"
              value={couponInput}
              onChange={(e) => setCouponInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); void applyCoupon(); } }}
              placeholder="Enter code (e.g. WELCOME40)"
              className="flex-1 h-10 px-3.5 rounded-lg border border-border bg-background text-sm text-foreground uppercase placeholder:normal-case focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
            />
            <button type="button" onClick={() => void applyCoupon()} disabled={couponLoading || !couponInput.trim()}
              className="h-10 px-4 bg-accent text-accent-foreground text-sm font-semibold rounded-lg hover:bg-accent/80 disabled:opacity-50 transition-colors flex items-center gap-1.5">
              <Tag size={13} />
              {couponLoading ? '…' : 'Apply'}
            </button>
          </div>
        )}
        {couponError && (
          <p className="text-[11px] text-destructive flex items-center gap-1.5">
            <AlertCircle size={11} />{couponError}
          </p>
        )}
      </div>

      {/* Order total */}
      {appliedCoupon && (
        <div className="bg-muted rounded-lg px-4 py-3 grid gap-1">
          <div className="flex justify-between text-[13px]">
            <span className="text-muted-foreground">Subtotal</span>
            <span>PKR {cartTotal.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-[13px] text-emerald-600">
            <span>Discount ({appliedCoupon.discount_percentage}%)</span>
            <span>−PKR {discountAmount.toLocaleString()}</span>
          </div>
          <div className="flex justify-between font-bold border-t border-border mt-1 pt-1">
            <span>Total</span>
            <span className="text-primary">PKR {finalTotal.toLocaleString()}</span>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="flex items-start gap-2 rounded-lg bg-destructive/10 text-destructive px-3 py-2.5 text-sm border border-destructive/20">
          <AlertCircle size={14} className="mt-0.5 shrink-0" />{error}
        </div>
      )}

      <button type="button" disabled={loading} onClick={() => void onCheckout()}
        className="w-full h-11 bg-primary text-primary-foreground font-semibold rounded-lg hover:bg-primary/90 active:scale-[0.98] transition-all disabled:opacity-60 flex items-center justify-center gap-2 text-sm">
        <ShoppingCart size={16} />
        {loading ? 'Processing…' : `Pay PKR ${finalTotal.toLocaleString()}`}
      </button>
    </div>
  );
}
