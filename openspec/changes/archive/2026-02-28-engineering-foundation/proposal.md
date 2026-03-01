## Why

A 2026-02-28 audit of the codebase found one critical security gap, two production bugs, four duplicated utility functions, a typography violation, and five workflow gaps that guarantee the same classes of mistake keep shipping. None of these block features directly, but they compound with every sprint. The social graph privacy leak (unauthenticated access to all follow relationships) must ship before any user growth work.

## What Changes

- **RLS security fix** — `user_follows` policy scoped to authenticated users only (currently `using (true)`)
- **Type generation wired to build** — `supabase gen types` runs on every pre-push, eliminating `as unknown as SomeType[]` casts
- **RLS auditor gate** — pre-push hook blocks when new `.sql` migration files are detected, until auditor is confirmed
- **5 workflow rules embedded in CLAUDE.md** — platform scope, error states, test-first, RLS audit, query signatures — enforced at session start
- **Activity feed bug fixes** — `loadMore` has no error state (button freezes on failure) and a `hasMore` off-by-one
- **`formatTime`/`formatTimeAgo` deduplicated** — 6 identical inline copies across both platforms → shared `lib/format.ts`
- **Typography violation fixed** — `fontWeight: '500'` in import-photo.tsx (medium weight violates the Inter Tight system)
- **Image fade-in on web carousel** — blur-to-clear reveal on recipe card images (home screen)
- **Web EmptyState component** — mobile has a shared `EmptyState` used in 5 screens; web shows blank divs

## Capabilities

### Modified Capabilities
- `activity-feed`: add error state + retry UI to `loadMore`, fix `hasMore` off-by-one
- `mobile-visual`: fix typography violation in import screens
- `project-setup`: add type generation script, rls-auditor gate to pre-push

### New Capabilities
- `project-setup`: `npm run gen:types` → regenerates Supabase types from linked project

## Impact

- **Database**: 1 migration — fix `user_follows` RLS (`using (true)` → scoped to `auth.uid()`)
- **Web app**: activity-feed.tsx (error state), home/page.tsx (recipe card extracted + image fade-in), new `src/components/ui/empty-state.tsx`, new `src/lib/format.ts`
- **Mobile app**: import-photo.tsx + import-url.tsx (typography fix), new `mobile/lib/format.ts`
- **Build/CI**: `package.json` (gen:types script), `.husky/pre-push` (type gen + rls gate), `scripts/check-migration-audit.sh`
- **Docs**: `.claude/CLAUDE.md` (5 workflow rules embedded), `docs/PRODUCT.md` (Sprint 0 section added)
- **No new tables, no API changes, no user-visible feature additions**
