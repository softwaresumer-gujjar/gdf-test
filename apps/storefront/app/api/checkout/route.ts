import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';

const frontendUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.gujjardairy.com';
const currency = process.env.STRIPE_CURRENCY ?? 'pkr';

function adminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

function stripeClient() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  return new Stripe(key);
}

interface CartItem { productId: string; quantity: number; }

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
    const stripe = stripeClient();

    // Resolve products from Supabase
    const productIds = items.map((i) => i.productId);
    let productsMap: Record<string, { id: string; name: string; description: string; pricePkr: number }> = {};

    if (sb) {
      const { data, error: dbError } = await sb
        .from('products')
        .select('id, name, description, price_pkr')
        .in('id', productIds)
        .eq('in_stock', true);
      if (dbError) {
        console.error('[checkout] Supabase product fetch error:', dbError);
        return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
      }
      if (data?.length) {
        for (const p of data) {
          productsMap[p.id as string] = {
            id: p.id as string,
            name: p.name as string,
            description: (p.description as string) ?? '',
            pricePkr: p.price_pkr as number,
          };
        }
      }
    } else {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
    }

    // Build line items
    type Snapshot = { productId: string; productName: string; quantity: number; unitPricePkr: number };
    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [];
    const itemsSnapshot: Snapshot[] = [];

    for (const item of items) {
      const product = productsMap[item.productId];
      if (!product) return NextResponse.json({ error: `Invalid product: ${item.productId}` }, { status: 400 });
      itemsSnapshot.push({ productId: product.id, productName: product.name, quantity: item.quantity, unitPricePkr: product.pricePkr });
      lineItems.push({
        price_data: {
          currency,
          product_data: { name: product.name, description: product.description || undefined },
          unit_amount: product.pricePkr * 100,
        },
        quantity: item.quantity,
      });
    }

    // Coupon validation
    let discountPct = 0;
    let offerId: string | null = null;
    let offerUsedCount = 0;

    if (couponCode && sb) {
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
      for (const li of lineItems) {
        const pd = li.price_data as Stripe.Checkout.SessionCreateParams.LineItem.PriceData;
        pd.unit_amount = Math.round((pd.unit_amount as number) * mul);
      }
      for (const snap of itemsSnapshot) snap.unitPricePkr = Math.round(snap.unitPricePkr * (1 - discountPct / 100));
    }

    // Stripe path
    if (stripe) {
      let session: Stripe.Checkout.Session;
      try {
        session = await stripe.checkout.sessions.create({
          mode: 'payment',
          customer_email: customerEmail,
          success_url: `${frontendUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
          cancel_url: `${frontendUrl}/checkout/cancelled`,
          line_items: lineItems,
          metadata: {
            locationId,
            itemsJson: JSON.stringify(itemsSnapshot),
            offerId: offerId ?? '',
            offerUsedCount: String(offerUsedCount),
          },
        });
      } catch (stripeErr) {
        const msg = stripeErr instanceof Error ? stripeErr.message : String(stripeErr);
        console.error('[checkout] Stripe error:', msg);
        return NextResponse.json({ error: `Payment setup failed: ${msg}` }, { status: 500 });
      }
      return NextResponse.json({ url: session.url });
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
