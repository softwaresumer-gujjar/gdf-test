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

await app.register(cors, {
  origin: true
});

await app.register(rawBody, {
  field: 'rawBody',
  global: false,
  encoding: 'utf8',
  runFirst: true,
  routes: ['/webhooks/stripe']
});

// ── Helpers: DB with in-memory fallback ─────────────────────────

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
    .select('id, name, slug, description, price_pkr, image_url, in_stock')
    .eq('in_stock', true);
  if (error || !data?.length) return staticProducts.filter((p) => p.inStock);
  return data.map((row) => ({
    id: row.id as string,
    name: row.name as string,
    slug: row.slug as string,
    description: (row.description as string) ?? '',
    pricePkr: row.price_pkr as number,
    imageUrl: (row.image_url as string) ?? '',
    inStock: row.in_stock as boolean
  }));
}

// ── Routes ───────────────────────────────────────────────────────

app.get('/health', async () => ({ ok: true, supabase: !!supabaseAdmin }));

app.get('/locations', async () => getLocations());

app.get('/products', async () => getProducts());

const checkoutSchema = z.object({
  items: z
    .array(
      z.object({
        productId: z.string(),
        quantity: z.number().int().positive().max(20)
      })
    )
    .min(1),
  locationId: z.string().min(1),
  customerEmail: z.string().email()
});

app.post<{ Body: CheckoutRequest }>('/checkout', async (request, reply) => {
  const parsed = checkoutSchema.safeParse(request.body);
  if (!parsed.success) {
    return reply.code(400).send({ error: parsed.error.flatten() });
  }

  const body = parsed.data;
  const allLocations = await getLocations();
  const location = allLocations.find((l) => l.id === body.locationId);

  if (!location) {
    return reply.code(400).send({ error: 'Invalid location' });
  }

  const allProducts = await getProducts();
  const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [];
  const itemsSnapshot: { productId: string; productName: string; quantity: number; unitPricePkr: number }[] = [];

  for (const item of body.items) {
    const product = allProducts.find((p) => p.id === item.productId);
    if (!product) {
      return reply.code(400).send({ error: `Invalid product: ${item.productId}` });
    }

    itemsSnapshot.push({
      productId: product.id,
      productName: product.name,
      quantity: item.quantity,
      unitPricePkr: product.pricePkr
    });

    lineItems.push({
      price_data: {
        currency: process.env.STRIPE_CURRENCY ?? 'pkr',
        product_data: { name: product.name, description: product.description },
        unit_amount: product.pricePkr * 100
      },
      quantity: item.quantity
    });
  }

  if (!stripe) {
    const fallbackAmount = itemsSnapshot.reduce((sum, i) => sum + i.unitPricePkr * i.quantity, 0);

    // Save mock order to database if Supabase is configured
    if (supabaseAdmin) {
      const { data: orderData, error: orderError } = await supabaseAdmin
        .from('orders')
        .insert({
          customer_email: body.customerEmail,
          location_id: body.locationId,
          status: 'paid',
          total_pkr: fallbackAmount,
          stripe_session_id: null
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
            unit_price_pkr: item.unitPricePkr
          }))
        );
        if (itemsError) {
          request.log.error({ itemsError }, 'Mock checkout: failed to save order items');
        } else {
          request.log.info({ orderId: orderData.id }, 'Mock order + items saved to Supabase');
        }

        return { url: `${frontendUrl}/checkout/success?mock=1&amount=${fallbackAmount}&order_id=${orderData.id}` };
      }
    }

    return { url: `${frontendUrl}/checkout/success?mock=1&amount=${fallbackAmount}` };
  }

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    customer_email: body.customerEmail,
    success_url: `${frontendUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${frontendUrl}/checkout/cancelled`,
    line_items: lineItems,
    metadata: {
      locationId: body.locationId,
      itemsJson: JSON.stringify(itemsSnapshot)
    }
  });

  return { url: session.url };
});

app.post('/webhooks/stripe', { config: { rawBody: true } }, async (request, reply) => {
  if (!stripe) {
    return reply.code(503).send({ error: 'Stripe is not configured' });
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    return reply.code(500).send({ error: 'Missing STRIPE_WEBHOOK_SECRET' });
  }

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
    const customerEmail =
      session.customer_details?.email ?? session.customer_email ?? 'unknown';

    request.log.info({
      eventType: event.type,
      checkoutSessionId: session.id,
      customerEmail,
      amountTotal: session.amount_total ?? 0
    }, 'Stripe checkout completed');

    if (supabaseAdmin) {
      const totalPkr = Math.round((session.amount_total ?? 0) / 100);
      const locationId = session.metadata?.locationId ?? null;
      const itemsJson = session.metadata?.itemsJson ?? '[]';

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
              unit_price_pkr: item.unitPricePkr
            }))
          );
          if (itemsError) request.log.error({ itemsError }, 'Failed to persist order items');
          else request.log.info({ orderId: orderData.id }, 'Order + items persisted to Supabase');
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
