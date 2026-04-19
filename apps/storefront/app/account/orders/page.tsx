import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '../../lib/supabase/server';
import type { Order, OrderItem } from '@packages/types';
import { ArrowLeft, Package } from 'lucide-react';

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
    <div className="min-h-screen bg-brand-gradient flex flex-col">
      {/* Header */}
      <header className="px-5 py-4 flex items-center gap-3">
        <Link href="/">
          <img src="/logo.svg" alt="Gujjar Dairy Farmers" className="h-10 w-10 rounded-xl shadow-lg" />
        </Link>
        <h1 className="text-white font-bold text-lg">My Orders</h1>
        <Link href="/" className="ml-auto flex items-center gap-1.5 text-white/70 hover:text-white text-sm transition-colors">
          <ArrowLeft size={15} />
          Back to shop
        </Link>
      </header>

      {/* Content card */}
      <div className="mx-4 mb-8">
        <div className="max-w-2xl mx-auto bg-white rounded-3xl overflow-hidden shadow-2xl">
          <div className="p-6 border-b border-gray-100">
            <p className="text-xs text-gray-400 font-medium">{orders?.length ?? 0} order{orders?.length !== 1 ? 's' : ''}</p>
          </div>

          {!orders?.length ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-300">
              <Package size={48} className="mb-3" />
              <p className="text-sm font-medium text-gray-400 mb-5">No orders yet</p>
              <Link href="/"
                className="bg-primary text-white text-sm font-bold px-5 py-2.5 rounded-full hover:bg-primary/90 transition-colors">
                Shop now
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {orders.map(order => (
                <div key={order.id} className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="text-[11px] font-mono text-gray-400">#{order.id.slice(0, 8)}</p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {new Date(order.created_at).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className={`inline-block text-[10px] font-bold px-2.5 py-1 rounded-full capitalize ${STATUS_STYLES[order.status] ?? 'bg-gray-100 text-gray-600'}`}>
                        {order.status}
                      </span>
                      <p className="font-black text-primary text-sm mt-1">PKR {(order.total_pkr ?? 0).toLocaleString()}</p>
                    </div>
                  </div>

                  {order.order_items?.length > 0 && (
                    <div className="bg-gray-50 rounded-xl p-3 grid gap-1.5">
                      {order.order_items.map(item => (
                        <div key={item.id} className="flex justify-between text-[12px]">
                          <span className="text-gray-600">{item.product_name} <span className="text-gray-400">×{item.quantity}</span></span>
                          <span className="font-semibold text-gray-700">PKR {(item.unit_price_pkr * item.quantity).toLocaleString()}</span>
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
  );
}
