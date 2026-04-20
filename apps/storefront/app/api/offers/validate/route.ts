import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function adminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code');
  if (!code) return NextResponse.json({ error: 'code query param required' }, { status: 400 });

  const sb = adminClient();
  if (!sb) return NextResponse.json({ error: 'Service unavailable' }, { status: 503 });

  const { data, error } = await sb
    .from('offers')
    .select('id, title, discount_percentage, active, stock_limit, used_count, expires_at')
    .eq('code', code.toUpperCase())
    .eq('active', true)
    .single();

  if (error || !data) return NextResponse.json({ error: 'Invalid or expired code' }, { status: 404 });

  const now = new Date().toISOString();
  if (data.expires_at && (data.expires_at as string) < now)
    return NextResponse.json({ error: 'Code has expired' }, { status: 404 });
  if (data.stock_limit !== null && (data.used_count as number) >= (data.stock_limit as number))
    return NextResponse.json({ error: 'Code usage limit reached' }, { status: 404 });

  return NextResponse.json({
    valid: true,
    discount_percentage: data.discount_percentage as number,
    title: data.title as string,
  });
}
