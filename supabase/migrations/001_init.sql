-- ============================================================
-- GDF (Gujjar Dairy Farmers) - Supabase Initial Schema
-- Run this in: Supabase Dashboard → SQL Editor
-- ============================================================

-- ----------------------------------------------------------------
-- 1. PROFILES  (extends auth.users with a role field)
-- ----------------------------------------------------------------
create table if not exists public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  role        text not null default 'customer',  -- 'customer' | 'admin'
  full_name   text,
  phone       text,
  created_at  timestamptz not null default now()
);

-- Auto-create profile when a new user signs up
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, role, full_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'role', 'customer'),
    coalesce(new.raw_user_meta_data->>'full_name', '')
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- RLS
alter table public.profiles enable row level security;

create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Admins can view all profiles"
  on public.profiles for select
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

-- ----------------------------------------------------------------
-- 2. LOCATIONS
-- ----------------------------------------------------------------
create table if not exists public.locations (
  id          text primary key,
  city        text not null,
  area        text not null,
  active      boolean not null default true,
  created_at  timestamptz not null default now()
);

alter table public.locations enable row level security;

-- Public read — anyone can browse delivery areas
create policy "Public can read active locations"
  on public.locations for select
  using (active = true);

-- Only admins can manage locations
create policy "Admins can manage locations"
  on public.locations for all
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

-- Seed data
insert into public.locations (id, city, area, active) values
  ('karachi-dha',     'Karachi', 'DHA',     true),
  ('karachi-clifton', 'Karachi', 'Clifton', true),
  ('karachi-gulshan', 'Karachi', 'Gulshan', true)
on conflict (id) do nothing;

-- ----------------------------------------------------------------
-- 3. PRODUCTS
-- ----------------------------------------------------------------
create table if not exists public.products (
  id           text primary key,
  name         text not null,
  slug         text not null unique,
  description  text,
  price_pkr    integer not null,
  image_url    text,
  video_url    text,
  in_stock     boolean not null default true,
  created_at   timestamptz not null default now()
);

alter table public.products enable row level security;

-- Public read for in-stock products
create policy "Public can read in-stock products"
  on public.products for select
  using (in_stock = true);

-- Admins can do everything
create policy "Admins can manage products"
  on public.products for all
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

-- Seed data
insert into public.products (id, name, slug, description, price_pkr, image_url, in_stock) values
  ('p1', 'Fresh Cow Milk 1L',          'fresh-cow-milk-1l',          'Daily fresh milk delivered chilled.',  320, 'https://images.unsplash.com/photo-1563636619-e9143da7973b?q=80&w=1200', true),
  ('p2', 'Chocolate Flavored Milk 250ml','chocolate-flavored-milk-250ml','Rich chocolate milk for quick energy.',180, 'https://images.unsplash.com/photo-1515037893149-de7f840978e2?q=80&w=1200', true),
  ('p3', 'Greek Yogurt 500g',           'greek-yogurt-500g',          'Creamy high-protein yogurt.',          650, 'https://images.unsplash.com/photo-1488477181946-6428a0291777?q=80&w=1200', true)
on conflict (id) do nothing;

-- ----------------------------------------------------------------
-- 4. ORDERS
-- ----------------------------------------------------------------
create table if not exists public.orders (
  id                 uuid primary key default gen_random_uuid(),
  customer_email     text not null,
  customer_id        uuid references auth.users (id) on delete set null,
  location_id        text references public.locations (id),
  stripe_session_id  text unique,
  status             text not null default 'pending',  -- pending | paid | dispatched | delivered | cancelled
  total_pkr          integer,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

alter table public.orders enable row level security;

-- Customers see only their own orders
create policy "Customers can view own orders"
  on public.orders for select
  using (auth.uid() = customer_id);

-- Admins can see and update all orders
create policy "Admins can manage all orders"
  on public.orders for all
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

-- Service role (API webhook) can insert orders
-- (service role bypasses RLS by default, so no explicit policy needed)

-- ----------------------------------------------------------------
-- 5. ORDER ITEMS
-- ----------------------------------------------------------------
create table if not exists public.order_items (
  id              uuid primary key default gen_random_uuid(),
  order_id        uuid not null references public.orders (id) on delete cascade,
  product_id      text references public.products (id),
  product_name    text not null,
  quantity        integer not null,
  unit_price_pkr  integer not null
);

alter table public.order_items enable row level security;

create policy "Customers can view own order items"
  on public.order_items for select
  using (
    exists (
      select 1 from public.orders o
      where o.id = order_items.order_id and o.customer_id = auth.uid()
    )
  );

create policy "Admins can manage all order items"
  on public.order_items for all
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

-- ----------------------------------------------------------------
-- 6. STORAGE BUCKETS (run via Supabase Dashboard → Storage, or here)
-- ----------------------------------------------------------------
-- Create buckets in Dashboard → Storage → New Bucket:
--   • product-images  (public: ON,  max file size: 50 MB)
--   • farm-media      (public: ON,  max file size: 5000 MB — Pro plan)
--
-- Then add these RLS policies on storage.objects:

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('product-images', 'product-images', true, 52428800,  array['image/jpeg','image/png','image/webp','image/gif']),
  ('farm-media',     'farm-media',     true, 5368709120, array['image/jpeg','image/png','image/webp','video/mp4','video/webm','video/quicktime'])
on conflict (id) do nothing;

-- Public read on both buckets
create policy "Public read product-images"
  on storage.objects for select
  using (bucket_id = 'product-images');

create policy "Public read farm-media"
  on storage.objects for select
  using (bucket_id = 'farm-media');

-- Only admins can upload / delete
create policy "Admins upload product-images"
  on storage.objects for insert
  with check (
    bucket_id = 'product-images' and
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

create policy "Admins upload farm-media"
  on storage.objects for insert
  with check (
    bucket_id = 'farm-media' and
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

create policy "Admins delete product-images"
  on storage.objects for delete
  using (
    bucket_id = 'product-images' and
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

create policy "Admins delete farm-media"
  on storage.objects for delete
  using (
    bucket_id = 'farm-media' and
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

-- ----------------------------------------------------------------
-- 7. HELPER: make a user an admin
-- Usage: select make_admin('user@email.com');
-- ----------------------------------------------------------------
create or replace function public.make_admin(user_email text)
returns void language plpgsql security definer as $$
declare
  target_id uuid;
begin
  select id into target_id from auth.users where email = user_email;
  if target_id is null then
    raise exception 'User % not found', user_email;
  end if;
  update public.profiles set role = 'admin' where id = target_id;
end;
$$;
