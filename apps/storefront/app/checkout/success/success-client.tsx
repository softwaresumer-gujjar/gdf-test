'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export function SuccessClient({ amount, orderId, sessionId }: { amount?: string; orderId?: string; sessionId?: string }) {
  useEffect(() => {
    // Clear cart from localStorage after successful payment
    window.localStorage.removeItem('milkman_cart');
  }, []);

  return (
    <div className="success-page">
      <p className="success-icon">✅</p>
      <h1>Payment Successful!</h1>
      <p className="success-subtitle">
        Shukriya! Aapka order place ho gaya hai.
      </p>

      {amount && (
        <p className="success-amount">
          Total: PKR {Number(amount).toLocaleString()}
        </p>
      )}

      {orderId && (
        <p className="success-meta">
          Order ID: <code>{orderId.slice(0, 8)}</code>
        </p>
      )}

      {sessionId && (
        <p className="success-meta success-meta--sm">
          Stripe Session: <code>{sessionId}</code>
        </p>
      )}

      <div className="success-actions">
        <Link href="/" className="button">Shop karte rahen</Link>
        <Link href="/account/orders" className="button secondary">Mere orders</Link>
      </div>
    </div>
  );
}
