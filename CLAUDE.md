# GDF (Gujjar Dairy Farmers) — Claude Code Guide

## Project Overview
E-commerce monorepo for a dairy farm. Customers buy milk/dairy products via storefront, payments via Stripe, admin manages orders/inventory/customers via dashboard.

## Monorepo Structure
```
apps/
  storefront/   → Next.js 15, port 3000  (customer-facing shop)
  admin/        → Next.js 15, port 3001  (admin dashboard)
  api/          → Fastify, port 4000     (checkout + Stripe webhook handler)
packages/
  types/        → Shared TypeScript types
supabase/
  functions/
    stripe-webhook/   → Edge Function: captures orders + customers on payment
  migrations/         → SQL migrations 001–004
```

## Dev Commands
```bash
npm run dev              # starts all 3 apps concurrently
npm run dev:storefront   # storefront only (port 3000)
npm run dev:admin        # admin only (port 3001)
npm run dev:api          # api only (port 4000)

# Stripe webhook forwarding (run in separate terminal for local dev)
stripe listen --forward-to http://localhost:4000/webhooks/stripe

# Deploy Edge Function
SUPABASE_ACCESS_TOKEN=<token> npx supabase functions deploy stripe-webhook --no-verify-jwt

# Push DB migration via Management API (preferred — avoids CLI version issues)
curl -s -X POST "https://api.supabase.com/v1/projects/jgdoopoziempqphbzdcb/database/query" \
  -H "Authorization: Bearer <SUPABASE_ACCESS_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"query": "<SQL>"}'
```

## Architecture: Data Flow

### Payment Flow (Production)
```
Storefront checkout → Stripe Checkout Session
→ Stripe webhook → Supabase Edge Function (stripe-webhook)
→ Supabase DB: orders + order_items + customers tables
→ Admin dashboard reads from Supabase on every page visit
```

### Payment Flow (Local Dev / No Stripe)
```
Storefront checkout → API /checkout (mock mode)
→ API saves order directly to Supabase (if supabaseAdmin configured)
→ Returns mock success URL with order_id
```

## Supabase Rules — CRITICAL

### Server pages (Next.js server components)
ALWAYS use the **service role key** — bypasses RLS, gets all data:
```ts
import { createClient } from '@supabase/supabase-js';
function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}
```

### Client components (browser)
Use the **anon key** client from `app/lib/supabase/client.ts`:
```ts
import { createClient } from '../../lib/supabase/client';
const sb = createClient(); // uses anon key + user session JWT
```

### NEVER mix these up — using anon key server-side leaks data through RLS.

## Next.js Rules — CRITICAL

### Every admin server page MUST have:
```ts
export const dynamic = 'force-dynamic';
```
Without this, Next.js may cache the page and serve stale data instead of fresh Supabase data.

### Place it as the very first line, before imports.

## Database Tables (Supabase)
| Table | Purpose |
|-------|---------|
| `profiles` | Auth users (signup via app) — role: customer/admin |
| `products` | Dairy products catalog |
| `locations` | Delivery areas |
| `orders` | All orders (Stripe + mock) |
| `order_items` | Line items per order |
| `customers` | Every paying customer (captured from Stripe webhook) |
| `offers` | Discount codes |
| `newsletter_subscribers` | Email subscribers |

### Key DB facts
- `customers` table is populated by the Edge Function, NOT by user signup
- A customer can be a guest (no `profiles` row) — always use `customers` table for customer reporting
- `is_admin()` function exists in Supabase (migration 003) — used by RLS policies
- Service role bypasses RLS — safe for server-side admin operations
- `products` table has a `featured BOOLEAN NOT NULL DEFAULT false` column (added via Management API) — used to show "Our Best" section on storefront
- `offers` table columns: `code`, `discount_percentage`, `active`, `stock_limit`, `used_count`, `expires_at`

## Secrets Management — NEVER COMMIT SECRETS

### Local dev
- `apps/api/.env` — Stripe keys + Supabase URL/service key
- `apps/admin/.env.local` — Supabase URL, anon key, service key
- `apps/storefront/.env.local` — Supabase URL, anon key, API URL
- All `.env` files are in `.gitignore`

### Production (Vercel)
- **ALWAYS use Vercel CLI** (`vercel`) for all Vercel operations — never the dashboard
- CLI is installed globally: `vercel --version`
- Auth token stored at `%APPDATA%/com.vercel.cli/Data/auth.json`
- Login: `vercel login` (opens browser)
- Env vars: `vercel env add KEY production` or via Vercel REST API
- Deploy storefront: `cd <repo-root> && vercel link --project gdf-storefront && vercel --prod`
- Deploy admin: `cd <repo-root> && vercel link --project gdf-admin && vercel --prod`
- Never hardcode keys in source files

#### Vercel Project Config
| Project | Vercel URL | Build Command | Output Dir |
|---------|-----------|---------------|------------|
| `gdf-storefront` | https://gdf-storefront.vercel.app | `npm run build --workspace=@apps/storefront` | `apps/storefront/.next` |
| `gdf-admin` | https://gdf-admin.vercel.app | `npm run build --workspace=@apps/admin` | `apps/admin/.next` |

Both projects build from **repo root** (not the app subdirectory) so npm workspaces can resolve `@packages/types`.
Team ID: `team_PShJguBRgoIO4oWTH3DdWYbS`

### Supabase Edge Functions
- Secrets set via: `npx supabase secrets set KEY=value`
- `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are auto-injected by Supabase runtime

## Stripe Setup
- **Webhook endpoint (production):** `https://jgdoopoziempqphbzdcb.supabase.co/functions/v1/stripe-webhook`
- **Webhook endpoint ID:** `we_1TNcXhFzUDvb7twkG6bpJ8gR`
- **Event:** `checkout.session.completed` only
- **Local dev webhook:** use `stripe listen --forward-to localhost:4000/webhooks/stripe`
- Local and production use DIFFERENT webhook secrets

## Supabase CLI Notes
- Use `SUPABASE_ACCESS_TOKEN` env var — do NOT run `supabase login` interactively
- `npx supabase --project-ref <ref>` flag does NOT work on this CLI version — use `--linked` or Management API
- Project ref: `jgdoopoziempqphbzdcb`
- Migrations: prefer Management API `database/query` endpoint for one-off SQL

## Testing
- Playwright installed locally: `node test-*.mjs`
- Admin login: stored in memory file (do not commit)
- Stripe test card: `4242 4242 4242 4242`, any future date, any CVC
- Trigger test webhook: `stripe trigger checkout.session.completed --api-key <key>`
- After trigger, verify in Supabase: `curl .../rest/v1/orders` with service key

## Storefront Architecture

### Routes
| Route | Type | Description |
|-------|------|-------------|
| `/` | Server + client | Full homepage (hero, promo, categories, featured products, catalog) |
| `/products/[id]` | Server + client | Product Detail Page (PDP) |
| `/checkout` | Client | Cart → Stripe checkout with coupon support |
| `/checkout/success` | Server | Post-payment confirmation |
| `/checkout/cancelled` | Server | Payment cancelled page |
| `/account/orders` | Server | Customer order history (requires auth) |
| `/login` | Client | Sign in page |
| `/signup` | Client | Create account page |

### API Routes (Fastify, port 4000)
| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/products` | All products (used by storefront homepage) |
| `GET` | `/products/:id` | Single product by ID (used by PDP) |
| `GET` | `/offers/validate?code=XXX` | Validate coupon code — returns `{ valid, discount_percentage, title }` or 404 |
| `POST` | `/checkout` | Create Stripe session; accepts optional `couponCode`; applies % discount to all line items; increments `used_count` |

### Shared UI Components
| File | Used on |
|------|---------|
| `app/ui/header.tsx` | Homepage, PDP — full sticky header with search autocomplete, cart button, wishlist count |
| `app/ui/page-header.tsx` | Checkout, login, signup, orders, cancelled, success — lightweight header |
| `app/ui/footer.tsx` | All pages — 4-column footer with trust badges |
| `app/ui/mini-cart.tsx` | Opened from Header — right-side sheet using `@radix-ui/react-dialog` |

### Cart Context
`app/lib/cart-context.tsx` — React Context wrapping the entire app (wired in `layout.tsx`).

Stores enriched cart items: `{ productId, name, pricePkr, imageUrl, quantity }`.
localStorage key: `gdf_cart_v2` (migrates old `gdf_cart` format on first load).

```ts
const { addToCart, removeFromCart, updateQuantity, clearCart, cartCount, cartTotal } = useCart();
```

### localStorage Keys
| Key | Format | Description |
|-----|--------|-------------|
| `gdf_cart_v2` | `CartItem[]` | Active cart items (enriched with name/price/image) |
| `gdf_wishlist` | `string[]` | Product IDs the user has wishlisted |
| `gdf_recently_viewed` | `string[]` | Product IDs recently viewed on PDP (max 10, newest first) |

### Custom DOM Events
| Event | Payload | When |
|-------|---------|------|
| `gdf-category-select` | `{ detail: categoryName }` | CategoryGrid fires, ShopClient listens to filter catalog |
| `gdf-wishlist-update` | (no payload) | Fired after wishlist localStorage change so all components re-read it |

### Coupon / Offer Flow
1. User enters code at checkout → `GET /offers/validate?code=XXX`
2. API checks: `active=true`, code matches, not expired, under stock_limit
3. Returns `{ valid: true, discount_percentage: 40, title: "WELCOME40" }`
4. Checkout client shows discount breakdown and updated total
5. On submit: `couponCode` sent in POST body → API applies discount to Stripe line items by multiplying `unit_amount * (1 - pct/100)` and increments `used_count`

### Header Strategy
- **Full `<Header>`**: use on homepage (`page.tsx`) and PDP (`products/[id]/page.tsx`) — needs product list for search autocomplete
- **`<PageHeader>`**: use on all other pages (checkout, login, signup, orders) — no product prop, server-compatible
- Never add search autocomplete to PageHeader; it would require passing products to every page

## Common Mistakes to Avoid
1. **Missing `force-dynamic`** → pages serve cached data from build time
2. **Using anon key in server components** → RLS blocks data, silent empty results
3. **`stripe listen` not running** → local webhooks never fire, orders not saved
4. **`supabase db push --project-ref` flag** → not supported, use `--linked` or Management API
5. **Committing `.env` files** → always check `.gitignore` before first commit
6. **Modifying `customers` table manually** → it's managed by the Edge Function; totals auto-calculate
7. **newsletter/offers RLS depends on `is_admin()`** → if function missing, these pages silently fail
8. **Using raw localStorage for cart** → use CartContext (`useCart()`) instead; raw localStorage misses the enriched item data (name, price, image) needed by mini-cart
9. **Using `<img>` without alt on product images** → use product name as alt text; emoji fallback for missing images
10. **Adding `<Header>` to checkout/login/signup pages** → use `<PageHeader>` instead to avoid passing products everywhere and keep these pages lightweight

## Environment Variables Reference

### apps/api/.env
```
PORT=4000
FRONTEND_URL=http://localhost:3000
STRIPE_SECRET_KEY=sk_test_...
STRIPE_CURRENCY=pkr
STRIPE_WEBHOOK_SECRET=whsec_...   ← local CLI secret (different from production)
SUPABASE_URL=https://...supabase.co
SUPABASE_SERVICE_ROLE_KEY=sb_secret_...
```

### apps/admin/.env.local
```
NEXT_PUBLIC_API_URL=http://localhost:4000
NEXT_PUBLIC_SUPABASE_URL=https://...supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_...
SUPABASE_SERVICE_ROLE_KEY=sb_secret_...
```

### apps/storefront/.env.local
```
NEXT_PUBLIC_API_URL=http://localhost:4000
NEXT_PUBLIC_SUPABASE_URL=https://...supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_...
```
