-- ============================================================
-- 004: Customers table — captures every paying customer
-- including guest checkouts from Stripe
-- ============================================================

create table if not exists public.customers (
  id                uuid        primary key default gen_random_uuid(),
  email             text        unique not null,
  name              text,
  phone             text,
  stripe_customer_id text,
  total_orders      integer     not null default 0,
  total_spent_pkr   integer     not null default 0,
  first_order_at    timestamptz,
  last_order_at     timestamptz,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

alter table public.customers enable row level security;

-- Admins can see and manage all customers
create policy "Admins can manage customers"
  on public.customers for all
  using (public.is_admin());

-- Service role bypasses RLS — Edge Function can always write
