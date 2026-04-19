'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { CheckCircle } from 'lucide-react';

export function SuccessClient({ amount, orderId, sessionId }: { amount?: string; orderId?: string; sessionId?: string }) {
  useEffect(() => {
    window.localStorage.removeItem('gdf_cart');
    window.dispatchEvent(new Event('gdf-cart-update'));
  }, []);

  return (
    <div className="text-center">
      <div className="w-16 h-16 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
        <CheckCircle size={36} className="text-green-500" />
      </div>
      <h1 className="text-xl font-bold mb-1">Payment Successful!</h1>
      <p className="text-sm text-muted-foreground mb-6">Shukriya! Aapka order place ho gaya hai.</p>

      {amount && (
        <div className="bg-accent rounded-lg px-4 py-3 mb-4">
          <p className="text-xs text-muted-foreground">Total paid</p>
          <p className="text-2xl font-black text-primary">PKR {Number(amount).toLocaleString()}</p>
        </div>
      )}

      {orderId && (
        <p className="text-xs text-muted-foreground mb-1">
          Order ID: <code className="bg-muted px-1.5 py-0.5 rounded font-mono">{orderId.slice(0, 8)}</code>
        </p>
      )}
      {sessionId && (
        <p className="text-[11px] text-muted-foreground/50 mb-6 font-mono truncate">{sessionId}</p>
      )}

      <div className="flex gap-3 justify-center mt-6">
        <Link href="/"
          className="bg-primary text-primary-foreground text-sm font-semibold px-5 py-2.5 rounded-lg hover:bg-primary/90 transition-colors">
          Shop karte rahen
        </Link>
        <Link href="/account/orders"
          className="border border-border text-muted-foreground text-sm font-medium px-5 py-2.5 rounded-lg hover:bg-accent transition-colors">
          Mere orders
        </Link>
      </div>
    </div>
  );
}
