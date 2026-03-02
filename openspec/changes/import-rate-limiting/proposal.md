## Why

Extract API routes have no rate limiting — a single user can import unlimited recipes at no cost, making the free→premium upgrade path meaningless. Adding a 10 imports/month cap on the free plan creates the clearest and most natural conversion trigger in the product: heavy importers are the most engaged users, and they hit the limit when they're most invested.

## What Changes

- Add `monthly_imports_used` and `imports_reset_at` columns to `user_profiles`
- Increment the counter in each `/api/extract-*` route before returning a result
- Gate import actions: reject with 429 when free users exceed 10/month
- Reset the counter lazily at check-time when the calendar month has rolled over
- Show a clear limit-hit UI on both web and mobile (import blocked, upgrade prompt)
- Premium users bypass the counter check entirely

## Capabilities

### New Capabilities

- `import-rate-limiting`: Monthly import counter enforcement — DB columns, API gate logic, counter increment, lazy monthly reset, and limit-hit UI on both platforms

### Modified Capabilities

- `recipe-crud`: Import actions now check and increment a rate limit counter before proceeding

## Impact

- **Database**: `user_profiles` — two new columns (`monthly_imports_used int4 default 0`, `imports_reset_at timestamptz`)
- **API routes**: `src/app/api/extract-url/route.ts`, `src/app/api/extract-instagram/route.ts`, `src/app/api/extract-photo/route.ts` — add limit check + increment logic
- **Web UI**: Import form/modal — show usage count, block when limit hit, show upgrade prompt
- **Mobile UI**: Import screens (URL, Instagram, Photo) — same gate, same prompt
- **No new dependencies** — lazy reset avoids cron job complexity
