import { SuccessClient } from './success-client';
import { Card, CardContent } from '@/components/ui/card';
import Link from 'next/link';

export default async function SuccessPage({
  searchParams
}: {
  searchParams: Promise<{ session_id?: string; mock?: string; amount?: string; order_id?: string }>;
}) {
  const params = await searchParams;

  return (
    <main className="min-h-screen bg-background flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <Link href="/"><img src="/logo.svg" alt="Gujjar Dairy Farmers" className="h-10 w-10 rounded-xl mx-auto" /></Link>
        </div>
        <Card>
          <CardContent className="p-8">
            <SuccessClient amount={params.amount} orderId={params.order_id} sessionId={params.session_id} />
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
