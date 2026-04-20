import 'dotenv/config';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import rawBody from 'fastify-raw-body';
import Stripe from 'stripe';
import { z } from 'zod';
import type { CheckoutRequest, LocationOption, Product } from '@packages/types';
import { locations as staticLocations } from './data/locations.js';
import { products as staticProducts } from './data/catalog.js';
import { stripe } from './stripe.js';
import { supabaseAdmin } from './supabase.js';

const app = Fastify({ logger: true });
const port = Number(process.env.PORT ?? 4000);
const frontendUrl = process.env.FRONTEND_URL ?? 'http://localhost:3000';

await app.register(cors, { origin: true });

await app.register(rawBody, {
  field: 'rawBody',
  global: false,
  encoding: 'utf8',
  runFirst: true,
  routes: ['/webhooks/stripe']
});

// ── Helpers ──────────────────────────────────────────────────────

function mapProduct(row: Record<string, unknown>): Product {
  return {
    id: row.id as string,
    name: row.name as string,
    slug: row.slug as string,
    description: (row.description as string) ?? '',
    pricePkr: row.price_pkr as number,
    imageUrl: (row.image_url as string) ?? '',
    inStock: row.in_stock as boolean,
    category: (row.category as string) ?? 'Milk',
    stockCount: (row.stock_count as number) ?? 0,
    featured: (row.featured as boolean) ?? false,
    visible: (row.visible as boolean) ?? false,
    createdAt: row.created_at as string,
  };
}

const PRODUCT_SELECT = 'id, name, slug, description, price_pkr, image_url, in_stock, category, stock_count, featured, visible, created_at';

async function getLocations(): Promise<LocationOption[]> {
  if (!supabaseAdmin) return staticLocations.filter((l) => l.active);
  const { data, error } = await supabaseAdmin
    .from('locations')
    .select('id, city, area, active')
    .eq('active', true);
  if (error || !data?.length) return staticLocations.filter((l) => l.active);
  return data as LocationOption[];
}

async function getProducts(): Promise<Product[]> {
  if (!supabaseAdmin) return staticProducts.filter((p) => p.inStock);
  const { data, error } = await supabaseAdmin
    .from('products')
    .select(PRODUCT_SELECT)
    .eq('in_stock', true)
    .eq('visible', true)
    .order('created_at', { ascending: false });
  if (error || !data?.length) return staticProducts.filter((p) => p.inStock);
  return data.map(mapProduct);
}

// ── Routes ───────────────────────────────────────────────────────

app.get('/health', async () => ({ ok: true, supabase: !!supabaseAdmin }));

app.get('/locations', async () => getLocations());

app.get('/products', async () => getProducts());

app.get('/products/:id', async (request, reply) => {
  const { id } = request.params as { id: string };
  if (!supabaseAdmin) {
    const p = staticProducts.find((p) => p.id === id);
    if (!p) return reply.code(404).send({ error: 'Not found' });
    return p;
  }
  const { data, error } = await supabaseAdmin
    .from('products')
    .select(PRODUCT_SELECT)
    .eq('id', id)
    .single();
  if (error || !data) return reply.code(404).send({ error: 'Not found' });
  return mapProduct(data);
});

app.get('/offers/validate', async (request, reply) => {
  const { code } = request.query as { code?: string };
  if (!code) return reply.code(400).send({ error: 'code query param required' });
  if (!supabaseAdmin) return reply.code(404).send({ error: 'Not found' });

  const { data, error } = await supabaseAdmin
    .from('offers')
    .select('id, title, discount_percentage, active, stock_limit, used_count, expires_at')
    .eq('code', code.toUpperCase())
    .eq('active', true)
    .single();

  if (error || !data) return reply.code(404).send({ error: 'Invalid or expired code' });

  const now = new Date().toISOString();
  if (data.expires_at && (data.expires_at as string) < now) {
    return reply.code(404).send({ error: 'Code has expired' });
  }
  if (data.stock_limit !== null && (data.used_count as number) >= (data.stock_limit as number)) {
    return reply.code(404).send({ error: 'Code usage limit reached' });
  }

  return {
    valid: true,
    discount_percentage: data.discount_percentage as number,
    title: data.title as string,
  };
});

const checkoutSchema = z.object({
  items: z
    .array(z.object({ productId: z.string(), quantity: z.number().int().positive().max(20) }))
    .min(1),
  locationId: z.string().min(1),
  customerEmail: z.string().email(),
  couponCode: z.string().optional(),
});

app.post<{ Body: CheckoutRequest }>('/checkout', async (request, reply) => {
  const parsed = checkoutSchema.safeParse(request.body);
  if (!parsed.success) return reply.code(400).send({ error: parsed.error.flatten() });

  const body = parsed.data;
  const allLocations = await getLocations();
  if (!allLocations.find((l) => l.id === body.locationId)) {
    return reply.code(400).send({ error: 'Invalid location' });
  }

  const allProducts = await getProducts();
  const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [];
  const itemsSnapshot: { productId: string; productName: string; quantity: number; unitPricePkr: number }[] = [];

  for (const item of body.items) {
    const product = allProducts.find((p) => p.id === item.productId);
    if (!product) return reply.code(400).send({ error: `Invalid product: ${item.productId}` });

    itemsSnapshot.push({
      productId: product.id,
      productName: product.name,
      quantity: item.quantity,
      unitPricePkr: product.pricePkr,
    });

    lineItems.push({
      price_data: {
        currency: process.env.STRIPE_CURRENCY ?? 'pkr',
        product_data: { name: product.name, description: product.description },
        unit_amount: product.pricePkr * 100,
      },
      quantity: item.quantity,
    });
  }

  // ── Coupon validation & discount ─────────────────────────────
  let discountPct = 0;
  let offerId: string | null = null;
  let offerUsedCount = 0;

  if (body.couponCode && supabaseAdmin) {
    const now = new Date().toISOString();
    const { data: offer } = await supabaseAdmin
      .from('offers')
      .select('id, discount_percentage, active, stock_limit, used_count, expires_at')
      .eq('code', body.couponCode.toUpperCase())
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
    const multiplier = 1 - discountPct / 100;
    for (const li of lineItems) {
      const pd = li.price_data as Stripe.Checkout.SessionCreateParams.LineItem.PriceData;
      pd.unit_amount = Math.round((pd.unit_amount as number) * multiplier);
    }
    for (const snap of itemsSnapshot) {
      snap.unitPricePkr = Math.round(snap.unitPricePkr * multiplier);
    }
  }

  // ── Mock path (no Stripe) ─────────────────────────────────────
  if (!stripe) {
    const fallbackAmount = itemsSnapshot.reduce((s, i) => s + i.unitPricePkr * i.quantity, 0);

    if (supabaseAdmin) {
      const { data: orderData, error: orderError } = await supabaseAdmin
        .from('orders')
        .insert({
          customer_email: body.customerEmail,
          location_id: body.locationId,
          status: 'paid',
          total_pkr: fallbackAmount,
          stripe_session_id: null,
        })
        .select('id')
        .single();

      if (orderError) {
        request.log.error({ orderError }, 'Mock checkout: failed to save order');
      } else if (orderData && itemsSnapshot.length) {
        const { error: itemsError } = await supabaseAdmin.from('order_items').insert(
          itemsSnapshot.map((item) => ({
            order_id: orderData.id,
            product_id: item.productId,
            product_name: item.productName,
            quantity: item.quantity,
            unit_price_pkr: item.unitPricePkr,
          }))
        );
        if (itemsError) {
          request.log.error({ itemsError }, 'Mock checkout: failed to save order items');
        } else {
          if (offerId) {
            await supabaseAdmin
              .from('offers')
              .update({ used_count: offerUsedCount + 1 })
              .eq('id', offerId);
          }
          request.log.info({ orderId: orderData.id }, 'Mock order + items saved to Supabase');
        }
        return { url: `${frontendUrl}/checkout/success?mock=1&amount=${fallbackAmount}&order_id=${orderData.id}` };
      }
    }

    return { url: `${frontendUrl}/checkout/success?mock=1&amount=${fallbackAmount}` };
  }

  // ── Stripe path ───────────────────────────────────────────────
  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    customer_email: body.customerEmail,
    success_url: `${frontendUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${frontendUrl}/checkout/cancelled`,
    line_items: lineItems,
    metadata: {
      locationId: body.locationId,
      itemsJson: JSON.stringify(itemsSnapshot),
      offerId: offerId ?? '',
      offerUsedCount: String(offerUsedCount),
    },
  });

  return { url: session.url };
});

// ── Stripe Webhook ────────────────────────────────────────────────

app.post('/webhooks/stripe', { config: { rawBody: true } }, async (request, reply) => {
  if (!stripe) return reply.code(503).send({ error: 'Stripe is not configured' });

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) return reply.code(500).send({ error: 'Missing STRIPE_WEBHOOK_SECRET' });

  const signatureHeader = request.headers['stripe-signature'];
  if (!signatureHeader || Array.isArray(signatureHeader)) {
    return reply.code(400).send({ error: 'Missing stripe-signature header' });
  }

  const rawRequestBody = ((request as { rawBody?: string }).rawBody ?? '');
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawRequestBody, signatureHeader, webhookSecret);
  } catch (error) {
    request.log.error(error);
    return reply.code(400).send({ error: 'Invalid webhook signature' });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    const customerEmail = session.customer_details?.email ?? session.customer_email ?? 'unknown';

    request.log.info({ eventType: event.type, checkoutSessionId: session.id, customerEmail }, 'Stripe checkout completed');

    if (supabaseAdmin) {
      const totalPkr = Math.round((session.amount_total ?? 0) / 100);
      const locationId = session.metadata?.locationId ?? null;
      const itemsJson = session.metadata?.itemsJson ?? '[]';
      const offerId = session.metadata?.offerId || null;
      const offerUsedCount = Number(session.metadata?.offerUsedCount ?? 0);

      const { data: orderData, error: orderError } = await supabaseAdmin
        .from('orders')
        .upsert(
          { stripe_session_id: session.id, customer_email: customerEmail, location_id: locationId, status: 'paid', total_pkr: totalPkr },
          { onConflict: 'stripe_session_id', ignoreDuplicates: false }
        )
        .select('id')
        .single();

      if (orderError) {
        request.log.error({ orderError }, 'Failed to persist order');
      } else if (orderData) {
        let parsedItems: { productId: string; productName: string; quantity: number; unitPricePkr: number }[] = [];
        try { parsedItems = JSON.parse(itemsJson) as typeof parsedItems; } catch { /* ignore */ }

        if (parsedItems.length) {
          const { error: itemsError } = await supabaseAdmin.from('order_items').insert(
            parsedItems.map((item) => ({
              order_id: orderData.id,
              product_id: item.productId,
              product_name: item.productName,
              quantity: item.quantity,
              unit_price_pkr: item.unitPricePkr,
            }))
          );
          if (itemsError) request.log.error({ itemsError }, 'Failed to persist order items');
          else request.log.info({ orderId: orderData.id }, 'Order + items persisted');
        }

        if (offerId) {
          await supabaseAdmin.from('offers').update({ used_count: offerUsedCount + 1 }).eq('id', offerId);
        }
      }
    }
  } else {
    request.log.info({ eventType: event.type }, 'Unhandled Stripe event');
  }

  return reply.send({ received: true });
});

try {
  await app.listen({ port, host: '0.0.0.0' });
  app.log.info(`API running at http://localhost:${port}`);
} catch (error) {
  app.log.error(error);
  process.exit(1);
}
