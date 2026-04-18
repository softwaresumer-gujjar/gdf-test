'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { CheckCircle } from 'lucide-react';

export function SuccessClient({ amount, orderId, sessionId }: { amount?: string; orderId?: string; sessionId?: string }) {
  useEffect(() => {
    window.localStorage.removeItem('gdf_cart');
  }, []);

  return (
    <div className="text-center py-4">
      <CheckCircle size={56} className="mx-auto mb-4 text-primary" />
      <h1 className="text-2xl font-bold text-primary mb-2">Payment Successful!</h1>
      <p className="text-muted-foreground mb-6">Shukriya! Aapka order place ho gaya hai.</p>

      {amount && (
        <p className="text-lg font-bold mb-2">Total: PKR {Number(amount).toLocaleString()}</p>
      )}
      {orderId && (
        <p className="text-sm text-muted-foreground mb-1">
          Order ID: <code className="bg-muted px-1.5 py-0.5 rounded font-mono text-xs">{orderId.slice(0, 8)}</code>
        </p>
      )}
      {sessionId && (
        <p className="text-xs text-muted-foreground mb-6">
          Stripe Session: <code className="font-mono">{sessionId}</code>
        </p>
      )}

      <div className="flex gap-3 justify-center mt-6">
        <Button asChild><Link href="/">Shop karte rahen</Link></Button>
        <Button variant="outline" asChild><Link href="/account/orders">Mere orders</Link></Button>
      </div>
    </div>
  );
}
