## 1. Database Migration

- [x] 1.1 Add `monthly_imports_used int4 NOT NULL DEFAULT 0` and `imports_reset_at timestamptz` columns to `user_profiles`
- [x] 1.2 Create RPC `check_and_increment_import_count(p_user_id uuid)` — SECURITY DEFINER, returns `{ allowed bool, used int, limit int }`. Logic: if `imports_reset_at` is null or in a prior calendar month, reset counter to 0 and update `imports_reset_at = now()`; if `plan = 'premium'`, return `{ allowed: true, used: 0, limit: 0 }`; if `monthly_imports_used >= 10`, return `{ allowed: false, used: 10, limit: 10 }`; otherwise increment and return `{ allowed: true, used: new_count, limit: 10 }`
- [x] 1.3 Run `rls-auditor` agent on the migration before committing

## 2. API Gate (Web)

- [x] 2.1 Add `checkImportLimit(userId: string)` helper in `src/lib/import-limit.ts` that calls the `check_and_increment_import_count` RPC and throws or returns the result
- [x] 2.2 Add limit gate to `src/app/api/extract-url/route.ts` — call `checkImportLimit` after auth check; return 429 with `{ error: 'import_limit_reached', used, limit }` if not allowed
- [x] 2.3 Add limit gate to `src/app/api/extract-instagram/route.ts` — same pattern
- [x] 2.4 Add limit gate to `src/app/api/extract-photo/route.ts` — same pattern
- [x] 2.5 Add `GET /api/import-status` route — returns `{ used: number, limit: number, plan: string }` for the authenticated user (reads from `user_profiles`, no increment)

## 3. Web UI

- [x] 3.1 On all three web import screens, fetch `GET /api/import-status` on mount and display "X of 10 imports used this month" for free users; hide for premium users (loading and error states required)
- [x] 3.2 When `used >= limit` on a free plan, disable the import submit button and show "You've used all 10 imports for this month" with a placeholder "Upgrade to Premium" CTA (no functioning paywall yet — visible but static)
- [x] 3.3 When any import API call returns 429, show "Monthly import limit reached. Upgrade to Premium for unlimited imports." inline (not a generic error)

## 4. Mobile UI

- [x] 4.1 Add import status fetch to the shared import entry point on mobile — call `/api/import-status` on screen focus, store `{ used, limit, plan }` in component state (loading, success, error states required)
- [x] 4.2 Display usage count on mobile import screens: free users see "X / 10 imports used this month" below the import options; premium users see nothing
- [x] 4.3 When `used >= limit` on free plan, disable import action buttons and show limit-reached message with placeholder upgrade CTA
- [x] 4.4 When any mobile import returns 429, show specific limit-reached message (not generic error fallback)

## 5. Verification

- [x] 5.1 Write a test for `check_and_increment_import_count` covering: within limit, at limit, reset on new month, premium bypass
- [x] 5.2 Verify all three API routes return 429 with correct shape when limit is hit
- [x] 5.3 Verify premium user can import without limit on both platforms
- [x] 5.4 Run platform-sync agent to confirm web and mobile parity
