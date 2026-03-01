## Context

The 2026-02-28 audit covered four pillars: workflow mechanics, capability utilisation, architecture reliability, and UI polish. The findings that require immediate code changes are collected here. Higher-level product work (TanStack Query, Domain Type Layer, web component library) is on the Sprint 2 roadmap — this change only addresses bugs and process gaps that exist today.

The full audit report is in the commit that introduced this change.

## Goals / Non-Goals

**Goals:**
- Close the one critical security gap before any user growth work
- Wire in guardrails that automatically catch the same classes of mistake in future
- Fix the two production bugs in the activity feed
- Eliminate the 6-copy `formatTime` duplication (one change = one edit)
- Fix the Inter Tight typography violation in mobile import screens
- Add two small UX polish items (image fade-in, web EmptyState)

**Non-Goals:**
- TanStack Query migration (Sprint 2)
- Domain type layer / shared types package (Sprint 2)
- Web component library expansion beyond EmptyState (Sprint 2+)
- Decomposing the 2,365-line recipe detail screen (separate change)
- Admin page unbounded query fix (low urgency, admin-only surface)

## Decisions

### 1. Process gates before code fixes

The workflow enforcement tasks (CLAUDE.md rules, pre-push hook, type generation) ship first. If the security fix migration is written before the RLS auditor gate exists, the gate is never validated against a real migration. By wiring the gate first, Task 4 (user_follows fix) is the first migration that actually runs through it.

### 2. Pre-push gate uses a shell script, not a separate npm package

`scripts/check-migration-audit.sh` is a 15-line shell script. Adding a dependency (e.g. a lint plugin) for this would be over-engineering. The script is readable, portable, and trivially maintained. Escape hatch: `SKIP_RLS_CHECK=1 git push` for cases where auditor was already run.

### 3. `formatTime` lives in `src/lib/format.ts` and `mobile/lib/format.ts` — not a shared package

Sharing across platforms via a `shared/` monorepo package requires TypeScript path alias changes on both platforms. The function is 8 lines. Copy-with-tests is the right call. If the function diverges in the future, that's a signal to revisit.

### 4. Activity feed `loadMore` gets a `finally` block and explicit error state, not a toast

The error state is rendered inline above the "Load more" button as a small red string with a "Tap to retry" affordance. No global toast system exists on web yet — introducing one for a single error message would be premature. Inline error is consistent with the form error pattern already in the codebase.

### 5. Image fade-in is CSS-only on web, not a shared component

The blur-to-clear reveal is 4 lines of CSS + an `onLoad` handler. It only applies to the home carousel. Making it a shared `<FadeImage>` component is YAGNI — do it if 3+ screens need it.

### 6. `user_follows` RLS scoped to own relationships + public profile counts

The new policy allows authenticated users to see:
1. Their own follow relationships (follower_id = auth.uid() OR following_id = auth.uid())
2. Follow counts for public profiles (subquery on user_profiles.privacy_setting = 'public')

This preserves follower count display on public profile pages without exposing the full graph to unauthenticated requests.
