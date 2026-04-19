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
      <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
        <CheckCircle size={36} className="text-green-500" />
      </div>
      <h1 className="text-xl font-bold text-gray-800 mb-1">Payment Successful!</h1>
      <p className="text-sm text-gray-400 mb-6">Shukriya! Aapka order place ho gaya hai.</p>

      {amount && (
        <div className="bg-primary/5 rounded-xl px-4 py-3 mb-4">
          <p className="text-xs text-gray-500">Total paid</p>
          <p className="text-2xl font-black text-primary">PKR {Number(amount).toLocaleString()}</p>
        </div>
      )}

      {orderId && (
        <p className="text-xs text-gray-400 mb-1">
          Order ID: <code className="bg-gray-100 px-1.5 py-0.5 rounded font-mono">{orderId.slice(0, 8)}</code>
        </p>
      )}
      {sessionId && (
        <p className="text-[11px] text-gray-300 mb-6 font-mono truncate">{sessionId}</p>
      )}

      <div className="flex gap-3 justify-center mt-6">
        <Link href="/"
          className="bg-primary text-white text-sm font-bold px-5 py-2.5 rounded-full hover:bg-primary/90 transition-colors">
          Shop karte rahen
        </Link>
        <Link href="/account/orders"
          className="border border-gray-200 text-gray-600 text-sm font-medium px-5 py-2.5 rounded-full hover:bg-gray-50 transition-colors">
          Mere orders
        </Link>
      </div>
    </div>
  );
}
