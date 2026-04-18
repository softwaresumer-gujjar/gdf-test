# /deploy-edge — Deploy Supabase Edge Function

Deploy the stripe-webhook Edge Function to Supabase production.

## Steps
1. Read memory file for SUPABASE_ACCESS_TOKEN (C:\Users\DELL\.claude\projects\d--sources-claude-code-projects-GDF-Test\memory\reference_credentials.md)
2. Run:
   ```
   SUPABASE_ACCESS_TOKEN=<token> npx supabase functions deploy stripe-webhook --project-ref jgdoopoziempqphbzdcb --no-verify-jwt
   ```
3. Verify deployment by triggering a test event:
   ```
   stripe trigger checkout.session.completed --api-key <STRIPE_SECRET_KEY>
   ```
4. Confirm new order + customer row appears in Supabase `orders` and `customers` tables
