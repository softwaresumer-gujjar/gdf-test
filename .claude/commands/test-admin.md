# /test-admin — Run Admin Dashboard Tests

Test all admin pages end-to-end using Playwright.

## Steps
1. Make sure dev servers are running (`npm run dev`)
2. Write a Playwright test script `test-admin.mjs` that:
   - Logs in with credentials from memory (gdfbackup@gmail.com)
   - Visits every admin page: dashboard, orders, products, inventory, customer, sales, analytics, offers, newsletter, settings
   - Checks each page loads without errors and shows expected content from Supabase
3. Run: `node test-admin.mjs`
4. Report results — pass/fail per page
5. Delete the test script after completion

## Admin Pages to Test
- /dashboard — Total Revenue, Total Orders, PKR data visible
- /orders — order count, table rows, status dropdown
- /products — product names from Supabase
- /inventory — stock metrics, badges
- /customer — customer table, email, order counts
- /sales — This Month, All-Time Revenue
- /analytics — charts, metrics
- /offers — metrics, New Offer modal opens
- /newsletter — loads without migration error
- /settings — Profile tab, email loads via Supabase Auth
