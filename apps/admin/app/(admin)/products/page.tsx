export const dynamic = 'force-dynamic';
import { createClient } from '@supabase/supabase-js';
import ProductsClient from './products-client';

function adminClient() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
}

export default async function ProductsPage() {
  const sb = adminClient();
  const { data: products } = await sb.from('products').select('*').order('created_at', { ascending: false });
  return <ProductsClient initialProducts={products ?? []} />;
}
