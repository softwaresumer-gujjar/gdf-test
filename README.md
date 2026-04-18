# Milkman-style Commerce Platform (Monorepo)

This is a Claude Code optimized implementation scaffold for rebuilding a milk delivery e-commerce experience end-to-end.

## Why this structure is cost-effective for Claude Code

1. **Clear bounded contexts** (`storefront`, `admin`, `api`) keep prompts focused.
2. **Shared types package** avoids duplication and drift.
3. **Single language stack (TypeScript)** reduces model context switching.
4. **Thin vertical slices** make it easier to ask Claude for small, low-token changes.
5. **Reusable flow docs** minimize repeated explanation in future prompts.

## Apps

- `apps/storefront`: Customer-facing web app (location -> catalog -> cart -> checkout).
- `apps/admin`: Separate admin app for products, inventory, and orders.
- `apps/api`: Backend API for catalog, cart, order, and Stripe checkout.

## Shared packages

- `packages/types`: Shared DTO/domain types.

## Quick start

1. Install dependencies:
   - `npm install`
2. Run all services:
   - `npm run dev`
3. Run individually:
   - `npm run dev:storefront`
   - `npm run dev:admin`
   - `npm run dev:api`

## Env setup

Copy env examples in each app:

- `apps/api/.env.example` -> `apps/api/.env`
- `apps/storefront/.env.example` -> `apps/storefront/.env.local`
- `apps/admin/.env.example` -> `apps/admin/.env.local`

## UI/Flow baseline implemented

### Storefront flow

1. Select order type (delivery)
2. Select location/city
3. Browse featured products
4. Add to cart
5. Checkout (create Stripe session from API)

### Admin flow

1. Sign-in placeholder
2. Dashboard metrics placeholder
3. Product list table
4. Order queue placeholder

## Next implementation milestones

1. Add auth (customer + admin)
2. Add DB (Prisma + Postgres)
3. Replace in-memory catalog with DB-backed services
4. Full order lifecycle and webhooks
5. Admin CRUD with optimistic UI
