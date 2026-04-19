import { SuccessClient } from './success-client';
import Link from 'next/link';

export default async function SuccessPage({
  searchParams
}: {
  searchParams: Promise<{ session_id?: string; mock?: string; amount?: string; order_id?: string }>;
}) {
  const params = await searchParams;

  return (
    <div className="min-h-screen bg-brand-gradient flex flex-col">
      <header className="px-5 py-4 flex items-center gap-3">
        <Link href="/">
          <img src="/logo.svg" alt="Gujjar Dairy Farmers" className="h-10 w-10 rounded-xl shadow-lg" />
        </Link>
      </header>
      <div className="flex-1 flex items-center justify-center px-4 pb-10">
        <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-8">
          <SuccessClient amount={params.amount} orderId={params.order_id} sessionId={params.session_id} />
        </div>
      </div>
    </div>
  );
}
