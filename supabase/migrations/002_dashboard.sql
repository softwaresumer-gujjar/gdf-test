-- ============================================================
-- GDF Dashboard Extensions
-- ============================================================

-- 1. Extend products with stock & category
alter table public.products
  add column if not exists stock_count integer not null default 0,
  add column if not exists category    text not null default 'Milk';

-- 2. OFFERS
create table if not exists public.offers (
  id                  uuid primary key default gen_random_uuid(),
  title               text not null,
  description         text,
  discount_percentage integer not null check (discount_percentage between 1 and 100),
  code                text unique,
  active              boolean not null default true,
  stock_limit         integer,
  used_count          integer not null default 0,
  expires_at          timestamptz,
  created_at          timestamptz not null default now()
);

alter table public.offers enable row level security;

create policy "Admins can manage offers"
  on public.offers for all
  using (public.is_admin());

create policy "Public can read active offers"
  on public.offers for select
  using (active = true);

-- Seed offer
insert into public.offers (title, description, discount_percentage, code, active, stock_limit)
values ('Welcome 40% Off', 'First order discount', 40, 'WELCOME40', true, 100)
on conflict (code) do nothing;

-- 3. NEWSLETTER SUBSCRIBERS
create table if not exists public.newsletter_subscribers (
  id            uuid primary key default gen_random_uuid(),
  email         text unique not null,
  active        boolean not null default true,
  subscribed_at timestamptz not null default now()
);

alter table public.newsletter_subscribers enable row level security;

create policy "Admins can manage newsletter"
  on public.newsletter_subscribers for all
  using (public.is_admin());
