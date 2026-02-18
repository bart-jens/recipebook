## Why

The recipe seed script (`scripts/seed.ts`) was useful during early development but is no longer needed. The platform has real users and real recipes now. Seeded recipes (Hollandse Appeltaart, Dan Dan Noodles) should be removed from the database and the script deleted.

## What Changes

- **Delete** `scripts/seed.ts`
- **Remove seeded recipes from the database** — Delete the 2 seeded recipes (Hollandse Appeltaart, Dan Dan Noodles) and their associated data (ingredients, tags, ratings)
- **No other files reference the seed script** (it's not in package.json scripts)

## Impact

**Codebase:**
- Delete `scripts/seed.ts`

**Database:**
- Manual cleanup: delete recipes by title where `source_type = 'manual'` and title IN ('Hollandse Appeltaart', 'Dan Dan Noodles')
- Cascade will handle ingredients, tags, ratings via foreign keys
