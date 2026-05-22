# /seed

Seed the database with realistic test data for local development.

## What to do

1. Read the database models to understand the schema.
2. Generate a seed script (e.g., `server/scripts/seed.js`) that inserts:
   - 2–3 landlord accounts
   - 5–10 property listings (varied types: apartment, house, studio)
   - 3–5 tenant accounts
   - A mix of active leases, applications, and past tenants
3. Ensure passwords are hashed, IDs are consistent (for foreign keys), and dates are realistic.
4. Add an npm script `"seed": "node server/scripts/seed.js"` to `package.json` if it doesn't exist.
5. The script should be idempotent — running it twice should not duplicate data (use upsert or clear-then-insert).
