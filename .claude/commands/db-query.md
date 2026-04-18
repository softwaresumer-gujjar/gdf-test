# /db-query — Run SQL on Supabase

Run a raw SQL query against the production Supabase database.

## Usage
Provide the SQL query as an argument, e.g.:
`/db-query SELECT * FROM orders LIMIT 5;`

## Steps
1. Read SUPABASE_ACCESS_TOKEN from memory
2. Run:
   ```
   curl -s -X POST "https://api.supabase.com/v1/projects/jgdoopoziempqphbzdcb/database/query" \
     -H "Authorization: Bearer <token>" \
     -H "Content-Type: application/json" \
     -d '{"query": "<SQL>"}'
   ```
3. Format and display results

## Notes
- Use this instead of `npx supabase db push` for one-off SQL (CLI version has flag compatibility issues)
- Always use single quotes inside the JSON query string
- Service role key is NOT needed here — Management API token is sufficient
