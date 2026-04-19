import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '../../lib/supabase/server';
import type { Order, OrderItem } from '@packages/types';
import { Package } from 'lucide-react';
import { PageHeader } from '../../ui/page-header';
import { Footer } from '../../ui/footer';

type OrderWithItems = Order & { order_items: OrderItem[] };

const STATUS_STYLES: Record<string, string> = {
  pending:    'bg-amber-100 text-amber-700',
  paid:       'bg-blue-100 text-blue-700',
  dispatched: 'bg-indigo-100 text-indigo-700',
  delivered:  'bg-green-100 text-green-700',
  cancelled:  'bg-red-100 text-red-700',
};

export default async function AccountOrdersPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login?next=/account/orders');

  const { data: orders } = await supabase
    .from('orders')
    .select('*, order_items(*)')
    .eq('customer_id', user.id)
    .order('created_at', { ascending: false }) as { data: OrderWithItems[] | null };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <PageHeader title="My Orders" />
      <div className="flex-1 max-w-screen-xl mx-auto w-full px-4 py-6">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-lg font-bold tracking-tight">My Orders</h1>
            <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
              {orders?.length ?? 0} order{orders?.length !== 1 ? 's' : ''}
            </p>
          </div>

          <div className="bg-card border border-border rounded-lg overflow-hidden">
            {!orders?.length ? (
              <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                <Package size={40} className="mb-3 opacity-40" />
                <p className="text-sm font-medium mb-5">No orders yet</p>
                <Link href="/"
                  className="bg-primary text-primary-foreground text-sm font-semibold px-5 py-2 rounded-lg hover:bg-primary/90 transition-colors">
                  Shop now
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {orders.map((order) => (
                  <div key={order.id} className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="text-[11px] font-mono text-muted-foreground">#{order.id.slice(0, 8)}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {new Date(order.created_at).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className={`inline-block text-[10px] font-bold px-2.5 py-1 rounded-full capitalize ${STATUS_STYLES[order.status] ?? 'bg-muted text-muted-foreground'}`}>
                          {order.status}
                        </span>
                        <p className="font-bold text-primary text-sm mt-1">PKR {(order.total_pkr ?? 0).toLocaleString()}</p>
                      </div>
                    </div>

                    {order.order_items?.length > 0 && (
                      <div className="bg-muted rounded-lg p-3 grid gap-1.5">
                        {order.order_items.map((item) => (
                          <div key={item.id} className="flex justify-between text-[12px]">
                            <span className="text-muted-foreground">{item.product_name} <span className="text-muted-foreground/60">×{item.quantity}</span></span>
                            <span className="font-semibold text-foreground">PKR {(item.unit_price_pkr * item.quantity).toLocaleString()}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
