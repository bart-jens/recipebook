## Context

All three extract API routes (`/api/extract-url`, `/api/extract-instagram`, `/api/extract-photo`) are open to any authenticated user with no usage limits. This makes the free→premium distinction meaningless for imports. We need a lightweight gate that's hard to abuse, easy to understand, and doesn't require external infra (no Redis, no cron jobs).

`user_profiles` already has a `plan` column (`free` | `premium`). We add two columns there: `monthly_imports_used` (counter) and `imports_reset_at` (timestamp). The gate lives in API middleware shared by all three routes.

## Goals / Non-Goals

**Goals:**
- Enforce 10 imports/month for free users across all three extract routes
- Reset the counter lazily (no cron, no background jobs)
- Show the current usage count in the import UI on both platforms
- Block free users at the API level with a clear 429 response
- Premium users bypass entirely

**Non-Goals:**
- Counting manual recipe entry (only AI/network-powered imports are gated)
- Per-route limits (one shared pool across all import types)
- Retroactive counting of past imports
- Building a full paywall/upgrade flow (that's Sprint 3 — just show an inline prompt for now)

## Decisions

### Decision: Lazy reset over cron job

**Chosen**: Check `imports_reset_at` at gate-time. If it's in a past calendar month, reset `monthly_imports_used = 0` and update `imports_reset_at = now()` in the same transaction before checking the limit.

**Alternative**: Supabase scheduled function (pg_cron) to reset all counters on the 1st of each month.

**Rationale**: Lazy reset requires zero infra. No scheduled jobs to configure, no missed resets, no race between cron timing and user action. The tradeoff is slightly complex gate logic, but it's self-contained in one function. The user always gets a fresh month when they first import after a month boundary — that's the intuitive behavior.

### Decision: Atomic check-and-increment in a single RPC

**Chosen**: Create a Supabase RPC `check_and_increment_import_count()` that runs as SECURITY DEFINER, performs the lazy reset check, enforces the limit, and increments atomically. Returns `{ allowed: boolean, used: number, limit: number }`.

**Alternative**: Read counter in API route, check in JS, then UPDATE separately.

**Rationale**: Two-step check-then-update creates a race condition if a user fires parallel import requests (e.g., opening the import dialog twice quickly). The RPC is atomic and runs inside a transaction. SECURITY DEFINER lets it update `user_profiles` regardless of RLS policies.

### Decision: Gate at API level, not UI level

**Chosen**: The 429 block happens in the API route. The UI shows remaining count (fetched separately) and disables the import button when count hits 0, but the API is the authoritative gate.

**Rationale**: UI-only gates are trivially bypassed. API gate is the real enforcement. UI gate is UX polish — it prevents the user from going through the whole import flow only to get blocked at the end.

### Decision: Surface remaining count via a lightweight profile endpoint

**Chosen**: Add `monthly_imports_used` to the existing profile fetch (or a new `/api/import-status` route). Both platforms fetch this on load of the import screen.

**Rationale**: Avoid adding DB queries to every page load. Only fetch when the user opens the import flow.

## Risks / Trade-offs

- **Clock skew**: Lazy reset uses `now()` in Postgres — consistent, no client-clock risk.
- **Counter drift**: If an extract API fails after incrementing but before returning, the count is charged. Acceptable — the AI call was made. Decrement on failure would require more complex error handling.
- **Bypass via direct API calls**: Users could call the API directly. The RPC gate handles this — it's enforced server-side regardless of client.
- **Import UI shows stale count**: Count displayed in UI is fetched at screen open, not real-time. If user imports quickly in two tabs, they could see inconsistent counts. Acceptable at this scale.

## Migration Plan

1. Write migration: add columns to `user_profiles`, create RPC
2. Run `rls-auditor` on migration before pushing
3. Deploy API changes (gate in all three extract routes)
4. Deploy UI changes (web + mobile import screens)
5. No backfill needed — counters start at 0 for all existing users (generous reset)
6. Rollback: remove gate logic from routes; columns are additive so no schema rollback needed
