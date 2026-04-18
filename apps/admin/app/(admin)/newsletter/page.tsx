export const dynamic = 'force-dynamic';
import { createClient } from '@supabase/supabase-js';
import NewsletterClient from './newsletter-client';

function adminClient() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
}

export default async function NewsletterPage() {
  const sb = adminClient();
  const { data: subscribers, error } = await sb
    .from('newsletter_subscribers')
    .select('*')
    .order('subscribed_at', { ascending: false });

  // Table may not exist yet if migration hasn't been run
  return <NewsletterClient initialSubscribers={error ? [] : (subscribers ?? [])} migrationNeeded={!!error} />;
}
