import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const frontendUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.gujjardairy.com';
const currency = (process.env.STRIPE_CURRENCY ?? 'pkr').toLowerCase();

function adminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

interface CartItem { productId: string; quantity: number; }

// Create a Stripe Checkout Session via direct REST API call (avoids SDK issues in serverless)
async function createStripeSession(params: {
  stripeKey: string;
  customerEmail: string;
  lineItems: Array<{ name: string; description?: string; unitAmount: number; quantity: number }>;
  metadata: Record<string, string>;
  successUrl: string;
  cancelUrl: string;
}): Promise<{ url: string | null; error?: string }> {
  const body = new URLSearchParams();
  body.append('mode', 'payment');
  body.append('customer_email', params.customerEmail);
  body.append('success_url', params.successUrl);
  body.append('cancel_url', params.cancelUrl);

  params.lineItems.forEach((item, i) => {
    body.append(`line_items[${i}][price_data][currency]`, currency);
    body.append(`line_items[${i}][price_data][unit_amount]`, String(item.unitAmount));
    body.append(`line_items[${i}][price_data][product_data][name]`, item.name);
    if (item.description) {
      body.append(`line_items[${i}][price_data][product_data][description]`, item.description);
    }
    body.append(`line_items[${i}][quantity]`, String(item.quantity));
  });

  for (const [k, v] of Object.entries(params.metadata)) {
    body.append(`metadata[${k}]`, v);
  }

  const res = await fetch('https://api.stripe.com/v1/checkout/sessions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${params.stripeKey}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: body.toString(),
  });

  const data = (await res.json()) as { url?: string; error?: { message?: string } };
  if (!res.ok) {
    return { url: null, error: data.error?.message ?? `Stripe error ${res.status}` };
  }
  return { url: data.url ?? null };
}

export async function POST(request: NextRequest) {
  try {
    let body: { items?: CartItem[]; locationId?: string; customerEmail?: string; couponCode?: string };
    try { body = (await request.json()) as typeof body; }
    catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }); }

    const { items, locationId, customerEmail, couponCode } = body;
    if (!items?.length || !locationId || !customerEmail) {
      return NextResponse.json({ error: 'items, locationId and customerEmail are required' }, { status: 400 });
    }

    const sb = adminClient();
    if (!sb) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
    }

    // Resolve products from Supabase
    const productIds = items.map((i) => i.productId);
    const { data: productRows, error: dbError } = await sb
      .from('products')
      .select('id, name, description, price_pkr')
      .in('id', productIds)
      .eq('in_stock', true);

    if (dbError) {
      console.error('[checkout] Supabase product fetch error:', dbError.message);
      return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
    }

    const productsMap: Record<string, { id: string; name: string; description: string; pricePkr: number }> = {};
    for (const p of (productRows ?? [])) {
      productsMap[p.id as string] = {
        id: p.id as string,
        name: p.name as string,
        description: (p.description as string) ?? '',
        pricePkr: p.price_pkr as number,
      };
    }

    // Build order snapshot
    type Snapshot = { productId: string; productName: string; quantity: number; unitPricePkr: number };
    const itemsSnapshot: Snapshot[] = [];
    const lineItems: Array<{ name: string; description?: string; unitAmount: number; quantity: number }> = [];

    for (const item of items) {
      const product = productsMap[item.productId];
      if (!product) return NextResponse.json({ error: `Invalid product: ${item.productId}` }, { status: 400 });
      itemsSnapshot.push({ productId: product.id, productName: product.name, quantity: item.quantity, unitPricePkr: product.pricePkr });
      lineItems.push({
        name: product.name,
        description: product.description || undefined,
        unitAmount: product.pricePkr * 100,
        quantity: item.quantity,
      });
    }

    // Coupon validation
    let discountPct = 0;
    let offerId: string | null = null;
    let offerUsedCount = 0;

    if (couponCode) {
      const now = new Date().toISOString();
      const { data: offer } = await sb
        .from('offers')
        .select('id, discount_percentage, active, stock_limit, used_count, expires_at')
        .eq('code', couponCode.toUpperCase())
        .eq('active', true)
        .single();

      if (
        offer &&
        (!offer.expires_at || (offer.expires_at as string) > now) &&
        (offer.stock_limit === null || (offer.used_count as number) < (offer.stock_limit as number))
      ) {
        discountPct = offer.discount_percentage as number;
        offerId = offer.id as string;
        offerUsedCount = offer.used_count as number;
      }
    }

    if (discountPct > 0) {
      const mul = 1 - discountPct / 100;
      for (const li of lineItems) li.unitAmount = Math.round(li.unitAmount * mul);
      for (const snap of itemsSnapshot) snap.unitPricePkr = Math.round(snap.unitPricePkr * (1 - discountPct / 100));
    }

    const stripeKey = process.env.STRIPE_SECRET_KEY;

    // Stripe path
    if (stripeKey) {
      const { url, error: stripeError } = await createStripeSession({
        stripeKey,
        customerEmail,
        lineItems,
        metadata: {
          locationId,
          itemsJson: JSON.stringify(itemsSnapshot),
          offerId: offerId ?? '',
          offerUsedCount: String(offerUsedCount),
        },
        successUrl: `${frontendUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
        cancelUrl: `${frontendUrl}/checkout/cancelled`,
      });

      if (stripeError) {
        console.error('[checkout] Stripe error:', stripeError);
        return NextResponse.json({ error: `Payment setup failed: ${stripeError}` }, { status: 500 });
      }

      return NextResponse.json({ url });
    }

    // Mock path (no Stripe configured)
    const fallbackAmount = itemsSnapshot.reduce((s, i) => s + i.unitPricePkr * i.quantity, 0);
    const { data: orderData, error: orderError } = await sb
      .from('orders')
      .insert({ customer_email: customerEmail, location_id: locationId, status: 'paid', total_pkr: fallbackAmount, stripe_session_id: null })
      .select('id')
      .single();

    if (!orderError && orderData) {
      await sb.from('order_items').insert(
        itemsSnapshot.map((i) => ({
          order_id: orderData.id,
          product_id: i.productId,
          product_name: i.productName,
          quantity: i.quantity,
          unit_price_pkr: i.unitPricePkr,
        }))
      );
      if (offerId) await sb.from('offers').update({ used_count: offerUsedCount + 1 }).eq('id', offerId);
      return NextResponse.json({ url: `${frontendUrl}/checkout/success?mock=1&amount=${fallbackAmount}&order_id=${orderData.id}` });
    }

    return NextResponse.json({ url: `${frontendUrl}/checkout/success?mock=1&amount=${fallbackAmount}` });

  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[checkout] Unhandled error:', msg);
    return NextResponse.json({ error: `Checkout error: ${msg}` }, { status: 500 });
  }
}
