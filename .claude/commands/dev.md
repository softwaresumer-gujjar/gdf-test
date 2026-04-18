# /dev — Start Development Environment

Start all three apps (storefront, admin, API) and the Stripe webhook listener.

## Steps
1. Run `npm run dev` in the project root to start storefront (3000), admin (3001), and API (4000)
2. In a separate process, run `stripe listen --forward-to http://localhost:4000/webhooks/stripe` for local webhook forwarding
3. Confirm all three servers are healthy:
   - Storefront: http://localhost:3000
   - Admin: http://localhost:3001
   - API health: http://localhost:4000/health (should return `{"ok":true,"supabase":true}`)
4. Report any startup errors to the user
