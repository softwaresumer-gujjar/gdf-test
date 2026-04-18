import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '../../lib/supabase/server';
import type { Order, OrderItem } from '@packages/types';

type OrderWithItems = Order & { order_items: OrderItem[] };

export default async function AccountOrdersPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/login?next=/account/orders');

  const { data: orders } = await supabase
    .from('orders')
    .select('*, order_items(*)')
    .eq('customer_id', user.id)
    .order('created_at', { ascending: false }) as { data: OrderWithItems[] | null };

  const statusColor: Record<string, string> = {
    pending: '#92400e',
    paid: '#065f46',
    dispatched: '#1e40af',
    delivered: '#14532d',
    cancelled: '#7f1d1d'
  };

  return (
    <main className="container" style={{ paddingTop: 40 }}>
      <h1>My Orders</h1>

      {!orders?.length ? (
        <div className="card" style={{ padding: 24, textAlign: 'center' }}>
          <p>You have no orders yet.</p>
          <Link href="/" className="button" style={{ marginTop: 12, display: 'inline-block' }}>
            Shop now
          </Link>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 16 }}>
          {orders.map((order) => (
            <div key={order.id} className="card" style={{ padding: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                <div>
                  <div style={{ fontSize: 13, color: '#6b7280' }}>
                    {new Date(order.created_at).toLocaleDateString('en-PK', {
                      day: 'numeric', month: 'short', year: 'numeric'
                    })}
                  </div>
                  <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 2 }}>#{order.id.slice(0, 8)}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{
                    background: statusColor[order.status] ?? '#374151',
                    color: '#fff',
                    padding: '2px 10px',
                    borderRadius: 12,
                    fontSize: 12,
                    textTransform: 'uppercase'
                  }}>
                    {order.status}
                  </span>
                  <div style={{ fontWeight: 700, marginTop: 4 }}>
                    PKR {(order.total_pkr ?? 0).toLocaleString()}
                  </div>
                </div>
              </div>

              {order.order_items?.length > 0 && (
                <table style={{ width: '100%', marginTop: 14, fontSize: 14, borderCollapse: 'collapse' }}>
                  <tbody>
                    {order.order_items.map((item) => (
                      <tr key={item.id} style={{ borderTop: '1px solid #e5e7eb' }}>
                        <td style={{ padding: '6px 0' }}>{item.product_name}</td>
                        <td style={{ padding: '6px 0', textAlign: 'center' }}>×{item.quantity}</td>
                        <td style={{ padding: '6px 0', textAlign: 'right' }}>
                          PKR {(item.unit_price_pkr * item.quantity).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
