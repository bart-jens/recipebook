## Part A — Workflow Enforcement
> Wire these in first. Task 4's migration is the first one that runs through the new gate.

### A.1 Wire Supabase type generation into build

**Files:**
- Modify: `package.json` (add `gen:types` script)
- Modify: `.husky/pre-push` (run gen:types before push)

- [x] A.1.1 Verify Supabase CLI: run `npx supabase --version`. If missing, install with `npm install -g supabase`.
- [x] A.1.2 Run `npx supabase gen types typescript --linked > src/types/supabase.ts` and confirm the file generates cleanly.
- [x] A.1.3 In `package.json` scripts, add: `"gen:types": "supabase gen types typescript --linked > src/types/supabase.ts"`
- [x] A.1.4 In `.husky/pre-push`, add `npm run gen:types` before the existing test commands.
- [x] A.1.5 Commit: `build: wire supabase type generation into pre-push hook`

### A.2 Embed 5 workflow rules in .claude/CLAUDE.md

**Files:**
- Modify: `.claude/CLAUDE.md`

- [x] A.2.1 Already done (2026-02-28 audit session). Verify the 5 rules are present in the `### Workflow Enforcement Rules` section under `## Critical Rules`.
- [x] A.2.2 Confirm `.claude/CLAUDE.md` also now says to use opsx skills for all planning, never `docs/plans/`.

### A.3 Add rls-auditor gate to pre-push hook

**Files:**
- Create: `scripts/check-migration-audit.sh`
- Modify: `.husky/pre-push`

- [x] A.3.1 Create `scripts/check-migration-audit.sh`:
  ```bash
  #!/bin/bash
  NEW_MIGRATIONS=$(git diff HEAD~1 --name-only --diff-filter=A 2>/dev/null | grep "supabase/migrations/.*\.sql$")
  if [ -n "$NEW_MIGRATIONS" ]; then
    echo ""
    echo "New migration files detected:"
    echo "$NEW_MIGRATIONS"
    echo ""
    echo "REQUIRED: Run the rls-auditor agent before pushing."
    echo "If already done, set SKIP_RLS_CHECK=1 to bypass."
    echo ""
    if [ "$SKIP_RLS_CHECK" != "1" ]; then
      exit 1
    fi
  fi
  ```
- [x] A.3.2 Make executable: `chmod +x scripts/check-migration-audit.sh`
- [x] A.3.3 Add `bash scripts/check-migration-audit.sh` to `.husky/pre-push`
- [x] A.3.4 Test with no new migrations: `bash scripts/check-migration-audit.sh` → expect silent exit 0
- [x] A.3.5 Commit: `ci: add rls-auditor gate to pre-push hook for new migrations`

---

## Part B — Security Fix

### B.4 Fix user_follows RLS — remove using (true) on select

**Files:**
- Create: `supabase/migrations/20240101000050_fix_user_follows_rls.sql`

- [x] B.4.1 Read `supabase/migrations/20240101000007_social_data_model.sql` — find the user_follows select policy and confirm it uses `using (true)`.
- [x] B.4.2 Create migration:
  ```sql
  -- Fix: user_follows select policy was using (true), allowing unauthenticated
  -- enumeration of the full social graph. Scope to authenticated users only.

  drop policy if exists "Followers can view anyone's profile" on public.user_follows;
  drop policy if exists "Users can view follows" on public.user_follows;

  -- Own relationships (follower or following)
  create policy "Users can view their own follow relationships"
    on public.user_follows for select
    to authenticated
    using (
      follower_id = auth.uid() or following_id = auth.uid()
    );

  -- Follow counts on public profiles (needed for profile pages)
  create policy "Users can view follow counts for public profiles"
    on public.user_follows for select
    to authenticated
    using (
      exists (
        select 1 from public.user_profiles
        where id = following_id
        and privacy_setting = 'public'
      )
    );
  ```
- [x] B.4.3 Run `npx supabase db push` — confirm migration applies cleanly.
- [x] B.4.4 **Run rls-auditor agent** on this migration before committing.
- [x] B.4.5 Manual verification: load home screen (activity feed shows), visit a public profile (follower count shows).
- [x] B.4.6 Commit: `fix(security): scope user_follows RLS to authenticated users only`

---

## Part C — Reliability Fixes

### C.5 Fix activity feed loadMore error state and hasMore off-by-one

**Files:**
- Modify: `src/app/(authenticated)/home/activity-feed.tsx` (~lines 95–120)
- Modify: `src/__tests__/activity-feed-crash.test.tsx`

- [x] C.5.1 Read `activity-feed.tsx` lines 90–130 — understand current `loadMore` and `hasMore` logic.
- [x] C.5.2 Add a `loadError` state and write the test first:
  ```typescript
  it('re-enables load more button after RPC failure', async () => {
    // mock supabase RPC to reject, click load more, assert button re-enabled + error message shown
  });
  ```
- [x] C.5.3 Run test to confirm it FAILS: `npx jest src/__tests__/activity-feed-crash.test.tsx -t "re-enables"` → FAIL expected.
- [x] C.5.4 Replace `loadMore` with:
  ```typescript
  const [loadError, setLoadError] = useState<string | null>(null);

  const loadMore = async () => {
    if (loading || !hasMore || items.length === 0) return;
    setLoading(true);
    setLoadError(null);
    const lastItem = items[items.length - 1];
    try {
      const { data, error } = await supabase.rpc('get_activity_feed', {
        p_user_id: userId,
        p_before: lastItem.event_at,
        p_limit: 20,
      });
      if (error) throw error;
      const newItems = (data || []) as FeedItem[];
      setItems((prev) => [...prev, ...newItems]);
      setHasMore(newItems.length >= 20);
    } catch {
      setLoadError("Couldn't load more. Tap to retry.");
    } finally {
      setLoading(false);
    }
  };
  ```
- [x] C.5.5 Add error display above the load more button:
  ```tsx
  {loadError && (
    <p className="text-[12px] text-red-500 text-center py-2">{loadError}</p>
  )}
  ```
- [x] C.5.6 Run test to confirm it PASSES.
- [x] C.5.7 Commit: `fix: add error state and finally block to activity feed loadMore`

### C.6 Extract formatTime / formatTimeAgo to shared lib

**Files:**
- Create: `src/lib/format.ts`
- Create: `src/__tests__/format.test.ts`
- Create: `mobile/lib/format.ts`
- Modify: `src/app/(authenticated)/home/page.tsx` (remove inline, add import)
- Modify: `src/app/(authenticated)/discover/page.tsx` (same)
- Modify: `src/app/(authenticated)/discover/load-more.tsx` (same)
- Modify: `mobile/app/(tabs)/index.tsx` (same)
- Modify: `mobile/app/(tabs)/discover.tsx` (same)
- (check for others with `grep -rn "function formatTime" src mobile`)

- [x] C.6.1 Write tests first in `src/__tests__/format.test.ts`:
  ```typescript
  import { formatTime, formatTimeAgo } from '../lib/format';
  describe('formatTime', () => {
    it('returns null for null', () => expect(formatTime(null)).toBeNull());
    it('returns "45 min" for 45', () => expect(formatTime(45)).toBe('45 min'));
    it('returns "1h" for 60', () => expect(formatTime(60)).toBe('1h'));
    it('returns "1h 30m" for 90', () => expect(formatTime(90)).toBe('1h 30m'));
    it('returns "2h" for 120', () => expect(formatTime(120)).toBe('2h'));
  });
  ```
- [x] C.6.2 Run: `npx jest src/__tests__/format.test.ts` → FAIL (module not found).
- [x] C.6.3 Create `src/lib/format.ts` with `formatTime` and `formatTimeAgo`. Copy exact logic from any one of the 6 inline duplicates.
- [x] C.6.4 Run: `npx jest src/__tests__/format.test.ts` → PASS.
- [x] C.6.5 Copy to mobile: `cp src/lib/format.ts mobile/lib/format.ts`
- [x] C.6.6 In each source file: delete inline function, add `import { formatTime } from '@/lib/format'` (or `'../../lib/format'` on mobile — match local import conventions).
- [x] C.6.7 Run full test suite: `npx jest && cd mobile && npx jest` → all PASS.
- [x] C.6.8 Commit: `refactor: extract formatTime/formatTimeAgo to shared lib, remove 6 duplicates`

---

## Part D — Design & UX

### D.7 Fix fontWeight: '500' typography violation in import screens

**Files:**
- Modify: `mobile/app/recipe/import-photo.tsx`
- Modify: `mobile/app/recipe/import-url.tsx`

- [x] D.7.1 Run: `grep -n "fontWeight\|fontSize: [0-9]" mobile/app/recipe/import-photo.tsx mobile/app/recipe/import-url.tsx`
- [x] D.7.2 For each `fontWeight: '500'`: replace with `fontWeight: '400'`.
- [x] D.7.3 For each hardcoded `fontSize` that maps to a typography token (e.g. `fontSize: 28` → `...typography.heading`, `fontSize: 13` → `...typography.bodySmall`): replace with the token spread.
- [x] D.7.4 Open the app and navigate to both import screens. Visually confirm text appearance is unchanged (medium weight was wrong — correct weight is 400).
- [x] D.7.5 Commit: `fix(design): replace fontWeight 500 with 400 in import screens, use typography tokens`

### D.8 Add recipe image fade-in to web home carousel

**Files:**
- Create: `src/app/(authenticated)/home/recipe-card.tsx`
- Modify: `src/app/(authenticated)/home/page.tsx`
- Modify: `src/app/globals.css`

- [x] D.8.1 Add to `src/app/globals.css`:
  ```css
  .img-reveal { filter: blur(8px); opacity: 0; transition: filter 350ms ease, opacity 350ms ease; }
  .img-reveal.loaded { filter: blur(0); opacity: 1; }
  ```
- [x] D.8.2 Create `src/app/(authenticated)/home/recipe-card.tsx` as a `'use client'` component. Move the recipe card JSX (image, title, tag, time) from `home/page.tsx` into it. Add `const [loaded, setLoaded] = useState(false)` and `onLoad={() => setLoaded(true)}` on the `<img>`. Apply `img-reveal ${loaded ? 'loaded' : ''}` classes.
- [x] D.8.3 In `home/page.tsx`, replace the inline recipe map with `<RecipeCard recipe={recipe} />`.
- [x] D.8.4 Visual test: open home page on throttled connection (Chrome DevTools → Network → Slow 3G) — images should blur-in rather than pop.
- [x] D.8.5 Commit: `feat(ux): blur-reveal image loading on home recipe carousel`

### D.9 Add web EmptyState component

**Files:**
- Create: `src/components/ui/empty-state.tsx`
- Modify: `src/app/(authenticated)/home/page.tsx` (replace 2 inline empty divs)

- [x] D.9.1 Create `src/components/ui/empty-state.tsx`:
  ```tsx
  interface EmptyStateProps {
    title: string;
    subtitle?: string;
    action?: { label: string; href: string };
  }
  export function EmptyState({ title, subtitle, action }: EmptyStateProps) {
    return (
      <div className="border-t border-border py-10 text-center">
        <p className="text-[14px] font-normal text-ink mb-1">{title}</p>
        {subtitle && <p className="text-[13px] font-light text-ink-secondary mb-3">{subtitle}</p>}
        {action && (
          <a href={action.href} className="text-[11px] font-normal tracking-[0.02em] text-accent hover:text-ink transition-colors">
            {action.label}
          </a>
        )}
      </div>
    );
  }
  ```
- [x] D.9.2 In `home/page.tsx` lines ~168–189: replace both inline empty-state divs with `<EmptyState ... />`.
- [x] D.9.3 Verify home page renders empty states correctly for: (a) not following anyone, (b) following but no activity.
- [x] D.9.4 Commit: `feat: add reusable EmptyState component to web`

---

## Verification

- [x] V.1 Run `npx jest` on web — all tests pass
- [x] V.2 Run `npx jest` in `mobile/` — all tests pass
- [x] V.3 Run `npx supabase db push` on a clean local DB — all migrations apply in order
- [x] V.4 Load the app end-to-end: home, activity feed load more, a public profile, both import screens
- [x] V.5 Confirm pre-push hook blocks on a test migration file, passes with `SKIP_RLS_CHECK=1`
