import Link from 'next/link';
import { CheckoutClient } from './ui/checkout-client';
import { ArrowLeft } from 'lucide-react';

export default function CheckoutPage() {
  return (
    <div className="min-h-screen bg-brand-gradient">
      {/* Header */}
      <header className="px-5 py-4 flex items-center gap-3">
        <Link href="/">
          <img src="/logo.svg" alt="Gujjar Dairy Farmers" className="h-10 w-10 rounded-xl shadow-lg" />
        </Link>
        <h1 className="text-white font-bold text-lg">Checkout</h1>
        <Link href="/" className="ml-auto flex items-center gap-1.5 text-white/70 hover:text-white text-sm transition-colors">
          <ArrowLeft size={15} />
          Back to shop
        </Link>
      </header>

      {/* Card */}
      <div className="mx-4 mb-8">
        <div className="max-w-lg mx-auto bg-white rounded-3xl overflow-hidden shadow-2xl p-7">
          <h2 className="text-lg font-bold text-gray-800 mb-5">Your Order</h2>
          <CheckoutClient />
        </div>
      </div>
    </div>
  );
}
