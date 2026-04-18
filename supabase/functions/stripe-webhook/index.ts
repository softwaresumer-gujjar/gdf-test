import Stripe from 'npm:stripe@17';
import { createClient } from 'npm:@supabase/supabase-js@2';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '');
const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET') ?? '';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
  { auth: { persistSession: false } }
);

Deno.serve(async (req: Request) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  const signature = req.headers.get('stripe-signature');
  if (!signature) {
    return new Response('Missing stripe-signature', { status: 400 });
  }

  const rawBody = await req.text();

  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(rawBody, signature, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return new Response('Invalid signature', { status: 400 });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;

    const customerEmail =
      session.customer_details?.email ?? session.customer_email ?? 'unknown';
    const customerName = session.customer_details?.name ?? null;
    const customerPhone = session.customer_details?.phone ?? null;
    const stripeCustomerId = typeof session.customer === 'string' ? session.customer : null;
    const totalPkr = Math.round((session.amount_total ?? 0) / 100);
    const locationId = session.metadata?.locationId ?? null;
    const itemsJson = session.metadata?.itemsJson ?? '[]';
    const now = new Date().toISOString();

    // ── 1. Upsert customer (new or returning) ────────────────────
    const { data: existingCustomer } = await supabase
      .from('customers')
      .select('id, total_orders, total_spent_pkr, first_order_at')
      .eq('email', customerEmail)
      .maybeSingle();

    if (existingCustomer) {
      // Returning customer — increment stats
      await supabase
        .from('customers')
        .update({
          name: customerName ?? existingCustomer.name,
          phone: customerPhone ?? existingCustomer.phone,
          stripe_customer_id: stripeCustomerId ?? existingCustomer.stripe_customer_id,
          total_orders: existingCustomer.total_orders + 1,
          total_spent_pkr: existingCustomer.total_spent_pkr + totalPkr,
          last_order_at: now,
          updated_at: now,
        })
        .eq('email', customerEmail);
      console.log('Returning customer updated:', customerEmail);
    } else {
      // New customer — insert
      await supabase
        .from('customers')
        .insert({
          email: customerEmail,
          name: customerName,
          phone: customerPhone,
          stripe_customer_id: stripeCustomerId,
          total_orders: 1,
          total_spent_pkr: totalPkr,
          first_order_at: now,
          last_order_at: now,
        });
      console.log('New customer saved:', customerEmail);
    }

    // ── 2. Save order ────────────────────────────────────────────
    const { data: orderData, error: orderError } = await supabase
      .from('orders')
      .upsert(
        {
          stripe_session_id: session.id,
          customer_email: customerEmail,
          location_id: locationId,
          status: 'paid',
          total_pkr: totalPkr,
        },
        { onConflict: 'stripe_session_id', ignoreDuplicates: false }
      )
      .select('id')
      .single();

    if (orderError) {
      console.error('Failed to save order:', orderError);
      return new Response('DB error saving order', { status: 500 });
    }

    // ── 3. Save order items ──────────────────────────────────────
    type ItemSnapshot = {
      productId: string;
      productName: string;
      quantity: number;
      unitPricePkr: number;
    };

    let parsedItems: ItemSnapshot[] = [];
    try {
      parsedItems = JSON.parse(itemsJson) as ItemSnapshot[];
    } catch {
      // no items metadata
    }

    if (parsedItems.length && orderData) {
      const { error: itemsError } = await supabase.from('order_items').insert(
        parsedItems.map((item) => ({
          order_id: orderData.id,
          product_id: item.productId,
          product_name: item.productName,
          quantity: item.quantity,
          unit_price_pkr: item.unitPricePkr,
        }))
      );
      if (itemsError) console.error('Failed to save order items:', itemsError);
    }

    console.log('Order saved:', orderData?.id, '| Email:', customerEmail, '| PKR:', totalPkr);
  }

  return new Response(JSON.stringify({ received: true }), {
    headers: { 'Content-Type': 'application/json' },
  });
});
