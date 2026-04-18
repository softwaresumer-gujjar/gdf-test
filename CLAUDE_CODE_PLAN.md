# Claude Code Work Plan

## UI snapshot assumptions (milkmanofficial-style)

- Header with location + support phone
- Hero/banner-focused landing
- Immediate ordering CTA
- Mandatory location selection before browsing
- Category/product cards
- Cart + checkout progression

## Cost-efficient Claude task slicing

Use one prompt per vertical slice:

1. `storefront/location-selector`
2. `storefront/product-listing`
3. `storefront/cart-state`
4. `checkout/stripe-session`
5. `api/order-create`
6. `admin/products-crud`
7. `admin/order-queue`
8. `auth/roles`

Each slice should touch max 3-5 files where possible.

## Definition of done (MVP)

- Customer can place an order via Stripe Checkout
- Admin can view incoming orders and update status
- Basic inventory checks prevent oversell
- Order confirmation page works
