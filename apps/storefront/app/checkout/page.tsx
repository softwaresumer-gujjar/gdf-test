import { ShoppingCart } from 'lucide-react';
import { CheckoutClient } from './ui/checkout-client';
import { PageHeader } from '../ui/page-header';
import { Footer } from '../ui/footer';

export default function CheckoutPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <PageHeader title="Checkout" />
      <div className="flex-1 max-w-screen-xl mx-auto w-full px-4 py-6">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center gap-2 mb-4">
            <ShoppingCart size={18} className="text-primary" />
            <h1 className="text-lg font-bold tracking-tight">Your Order</h1>
          </div>
          <div className="bg-card border border-border rounded-lg p-6">
            <CheckoutClient />
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
