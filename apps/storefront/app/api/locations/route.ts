import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { fallbackLocations } from '../../lib/fallback-data';

function adminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

export async function GET() {
  const sb = adminClient();
  if (sb) {
    try {
      const { data } = await sb.from('locations').select('id, city, area, active').eq('active', true);
      if (data?.length) return NextResponse.json(data);
    } catch { /* fall through */ }
  }
  return NextResponse.json(fallbackLocations);
}
