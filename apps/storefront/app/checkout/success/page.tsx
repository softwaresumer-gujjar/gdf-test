import { SuccessClient } from './success-client';

export default async function SuccessPage({
  searchParams
}: {
  searchParams: Promise<{ session_id?: string; mock?: string; amount?: string; order_id?: string }>;
}) {
  const params = await searchParams;

  return (
    <main className="container" style={{ paddingTop: 30 }}>
      <div className="card" style={{ padding: 24 }}>
        <SuccessClient
          amount={params.amount}
          orderId={params.order_id}
          sessionId={params.session_id}
        />
      </div>
    </main>
  );
}
