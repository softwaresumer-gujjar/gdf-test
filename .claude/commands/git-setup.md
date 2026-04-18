# /git-setup — Initialize Git and Push to GitHub

Set up git repository and push to GitHub safely (no secrets committed).

## Steps
1. Verify `.gitignore` exists and covers all `.env*` files — if not, create it first
2. Create `.env.example` files for each app with placeholder values (no real keys)
3. Run `git init` in project root
4. Run `git add .` — verify no `.env` files are staged (`git status`)
5. If any `.env` file is staged, stop and fix `.gitignore` first
6. Run initial commit: `git commit -m "Initial commit — GDF monorepo"`
7. Add the remote: `git remote add origin <REPO_URL_PROVIDED_BY_USER>`
8. Push: `git push -u origin main`
9. Confirm push succeeded and no secrets are in the remote

## CRITICAL — Never commit these files
- `apps/api/.env`
- `apps/admin/.env.local`
- `apps/storefront/.env.local`
- Any file matching `*.env*` with real values
