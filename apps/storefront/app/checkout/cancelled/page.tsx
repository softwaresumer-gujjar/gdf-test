import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { XCircle } from 'lucide-react';

export default function CancelledPage() {
  return (
    <main className="min-h-screen bg-background flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <Link href="/" className="text-primary font-bold text-lg">Pure Dairy Farmers</Link>
        </div>
        <Card>
          <CardContent className="p-8 text-center">
            <XCircle size={48} className="mx-auto mb-4 text-muted-foreground opacity-60" />
            <h1 className="text-xl font-bold mb-2">Payment cancelled</h1>
            <p className="text-sm text-muted-foreground mb-6">You can return to your cart and retry checkout.</p>
            <div className="flex gap-3 justify-center">
              <Button asChild><Link href="/checkout">Back to checkout</Link></Button>
              <Button variant="outline" asChild><Link href="/">Continue shopping</Link></Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
