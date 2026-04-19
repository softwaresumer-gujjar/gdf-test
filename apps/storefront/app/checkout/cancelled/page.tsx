import Link from 'next/link';
import { XCircle } from 'lucide-react';

export default function CancelledPage() {
  return (
    <div className="min-h-screen bg-brand-gradient flex flex-col">
      <header className="px-5 py-4 flex items-center gap-3">
        <Link href="/">
          <img src="/logo.svg" alt="Gujjar Dairy Farmers" className="h-10 w-10 rounded-xl shadow-lg" />
        </Link>
      </header>
      <div className="flex-1 flex items-center justify-center px-4 pb-10">
        <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-8 text-center">
          <XCircle size={52} className="mx-auto mb-4 text-gray-300" />
          <h1 className="text-xl font-bold text-gray-800 mb-2">Payment cancelled</h1>
          <p className="text-sm text-gray-500 mb-7">You can return to your cart and retry checkout.</p>
          <div className="flex gap-3 justify-center">
            <Link href="/checkout"
              className="bg-primary text-white text-sm font-bold px-5 py-2.5 rounded-full hover:bg-primary/90 transition-colors">
              Back to checkout
            </Link>
            <Link href="/"
              className="border border-gray-200 text-gray-600 text-sm font-medium px-5 py-2.5 rounded-full hover:bg-gray-50 transition-colors">
              Continue shopping
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
