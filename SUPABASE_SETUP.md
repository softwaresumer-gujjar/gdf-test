# Supabase Setup Guide — GDF Platform

## Step 1: Create a Supabase project

1. Go to **[supabase.com/dashboard](https://supabase.com/dashboard)** and sign up (free)
2. Click **New project**
3. Name it `gdf-production` (or `gdf-dev` for a dev project)
4. Choose a region close to Pakistan (e.g., **Singapore** or **Mumbai**)
5. Set a strong database password and save it securely
6. Click **Create new project** — wait ~2 minutes for provisioning

---

## Step 2: Run the database migration

1. In the Supabase Dashboard, go to **SQL Editor**
2. Open the file `supabase/migrations/001_init.sql` from this repo
3. Paste the entire file into the SQL editor and click **Run**
4. This creates: `profiles`, `locations`, `products`, `orders`, `order_items` tables + RLS policies + storage buckets + seed data

---

## Step 3: Get your API keys

In the Supabase Dashboard → **Project Settings → API**:

| Key | Where to use |
|---|---|
| `Project URL` | All three apps |
| `anon` public key | Storefront + Admin (client-side) |
| `service_role` secret key | API only — **never expose to browser** |

---

## Step 4: Fill in environment variables

### `apps/api/.env`
```
SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...your-service-role-key...
```

### `apps/storefront/.env.local`
```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...your-anon-key...
```

### `apps/admin/.env.local`
```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...your-anon-key...
```

---

## Step 5: Make yourself an admin

1. Sign up on the **storefront** at `http://localhost:3000/signup`
2. Confirm your email via the Supabase confirmation email
3. In Supabase Dashboard → **SQL Editor**, run:
   ```sql
   select make_admin('your-email@example.com');
   ```
4. Now you can sign in at `http://localhost:3001/login` with admin access

---

## Step 6: Upload product media

1. Go to `http://localhost:3001/products/upload`
2. Select bucket `product-images` for photos, `farm-media` for videos
3. Upload your file — copy the returned public CDN URL
4. In Supabase Dashboard → **Table Editor → products**, paste the URL into `image_url` or `video_url`

---

## Storage limits

| Bucket | Free plan | Pro plan ($25/mo) |
|---|---|---|
| `product-images` | 1 GB total / 50 MB per file | 100 GB / 50 MB per file |
| `farm-media` | 1 GB total / 50 MB per file | 100 GB / **5 GB per file** |

> For massive videos (hundreds of MB to GB), use the **TUS resumable upload** client (`tus-js-client`).
> For streaming video delivery at scale, consider pairing with **Cloudflare Stream** or **Bunny.net** — Supabase stores the source file, CDN delivers it.

---

## What's wired up

| Feature | Status |
|---|---|
| Products from DB | ✅ API reads Supabase, falls back to static data |
| Locations from DB | ✅ Same pattern |
| Order persistence | ✅ Stripe webhook upserts order + items on `checkout.session.completed` |
| Customer auth | ✅ `/login`, `/signup`, `/account/orders` in storefront |
| Admin auth + role check | ✅ Middleware blocks non-admins on every admin route |
| Admin dashboard — real orders | ✅ Reads live from `orders` table |
| Media upload | ✅ `/products/upload` in admin |
| Row Level Security | ✅ Customers see only their orders; admins see all |
| Storage RLS | ✅ Public read; admin-only write |
