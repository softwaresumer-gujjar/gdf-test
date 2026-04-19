import Link from 'next/link';
import { XCircle } from 'lucide-react';
import { PageHeader } from '../../ui/page-header';
import { Footer } from '../../ui/footer';

export default function CancelledPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <PageHeader />
      <div className="flex-1 flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-md bg-card border border-border rounded-lg shadow-sm p-8 text-center">
          <XCircle size={48} className="mx-auto mb-4 text-muted-foreground/40" />
          <h1 className="text-xl font-bold mb-2">Payment cancelled</h1>
          <p className="text-sm text-muted-foreground mb-7">You can return to your cart and retry checkout.</p>
          <div className="flex gap-3 justify-center">
            <Link href="/checkout"
              className="bg-primary text-primary-foreground text-sm font-semibold px-5 py-2.5 rounded-lg hover:bg-primary/90 transition-colors">
              Back to checkout
            </Link>
            <Link href="/"
              className="border border-border text-muted-foreground text-sm font-medium px-5 py-2.5 rounded-lg hover:bg-accent transition-colors">
              Continue shopping
            </Link>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
