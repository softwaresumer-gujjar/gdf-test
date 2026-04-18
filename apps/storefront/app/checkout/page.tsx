import Link from 'next/link';
import { CheckoutClient } from './ui/checkout-client';
import { Button } from '@/components/ui/button';

export default function CheckoutPage() {
  return (
    <main className="min-h-screen bg-background">
      <header className="bg-card border-b border-border">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/"><img src="/logo.svg" alt="Gujjar Dairy Farmers" className="h-9 w-9 rounded-xl" /></Link>
          <Button variant="outline" size="sm" asChild>
            <Link href="/">← Back to shop</Link>
          </Button>
        </div>
      </header>
      <div className="max-w-2xl mx-auto px-4 py-10">
        <h1 className="text-2xl font-bold mb-6">Checkout</h1>
        <CheckoutClient />
      </div>
    </main>
  );
}
