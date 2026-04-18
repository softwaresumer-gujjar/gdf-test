import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '../../lib/supabase/server';
import type { Order, OrderItem } from '@packages/types';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

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

  return (
    <main className="min-h-screen bg-background">
      <header className="bg-card border-b border-border">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/" className="text-primary font-bold text-lg">Gujjar Dairy Farmers</Link>
          <Button variant="outline" size="sm" asChild>
            <Link href="/">← Back to shop</Link>
          </Button>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-10">
        <h1 className="text-2xl font-bold mb-6">My Orders</h1>

        {!orders?.length ? (
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-muted-foreground mb-4">You have no orders yet.</p>
              <Button asChild><Link href="/">Shop now</Link></Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {orders.map(order => (
              <Card key={order.id}>
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <p className="text-xs text-muted-foreground">
                        {new Date(order.created_at).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                      <p className="text-xs text-muted-foreground font-mono mt-0.5">#{order.id.slice(0, 8)}</p>
                    </div>
                    <div className="text-right">
                      <Badge variant={order.status as 'pending' | 'paid' | 'dispatched' | 'delivered' | 'cancelled'}>
                        {order.status}
                      </Badge>
                      <p className="font-bold text-sm mt-1">PKR {(order.total_pkr ?? 0).toLocaleString()}</p>
                    </div>
                  </div>

                  {order.order_items?.length > 0 && (
                    <div className="border-t border-border pt-3 grid gap-2">
                      {order.order_items.map(item => (
                        <div key={item.id} className="flex justify-between text-sm">
                          <span className="text-muted-foreground">{item.product_name} ×{item.quantity}</span>
                          <span className="font-semibold">PKR {(item.unit_price_pkr * item.quantity).toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
