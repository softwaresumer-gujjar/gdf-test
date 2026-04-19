import { SuccessClient } from './success-client';
import { PageHeader } from '../../ui/page-header';
import { Footer } from '../../ui/footer';

export default async function SuccessPage({
  searchParams
}: {
  searchParams: Promise<{ session_id?: string; mock?: string; amount?: string; order_id?: string }>;
}) {
  const params = await searchParams;
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <PageHeader />
      <div className="flex-1 flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-md bg-card border border-border rounded-lg shadow-sm p-8">
          <SuccessClient amount={params.amount} orderId={params.order_id} sessionId={params.session_id} />
        </div>
      </div>
      <Footer />
    </div>
  );
}
