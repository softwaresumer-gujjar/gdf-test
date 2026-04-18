export const dynamic = 'force-dynamic';
import { createClient } from '@supabase/supabase-js';
import OffersClient from './offers-client';

function adminClient() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
}

export default async function OffersPage() {
  const sb = adminClient();
  const { data: offers } = await sb.from('offers').select('*').order('created_at', { ascending: false });
  return <OffersClient initialOffers={offers ?? []} />;
}
