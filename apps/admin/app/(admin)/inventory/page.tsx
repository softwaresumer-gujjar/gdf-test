export const dynamic = 'force-dynamic';
import { createClient } from '@supabase/supabase-js';
import InventoryClient from './inventory-client';

function adminClient() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
}

export default async function InventoryPage() {
  const sb = adminClient();
  const { data: products } = await sb.from('products').select('id,name,category,stock_count,in_stock,price_pkr,image_url').order('stock_count');
  return <InventoryClient initialProducts={products ?? []} />;
}
