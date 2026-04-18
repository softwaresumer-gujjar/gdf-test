export const dynamic = 'force-dynamic';
import { createClient } from '@supabase/supabase-js';
import OrdersClient from './orders-client';

function adminClient() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
}

export default async function OrdersPage() {
  const sb = adminClient();
  const { data: orders } = await sb
    .from('orders')
    .select('*, order_items(id, product_name, quantity, unit_price_pkr)')
    .order('created_at', { ascending: false });
  return <OrdersClient initialOrders={orders ?? []} />;
}
