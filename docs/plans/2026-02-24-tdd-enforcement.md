# TDD Enforcement Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Enforce test-driven development across web (Next.js) and mobile (Expo) via pre-push hooks and CI, and fix the same null-crash bugs on web that were just fixed on mobile.

**Architecture:** Web gets jest + @testing-library/react using the next/jest helper; mobile already has 33 passing tests. A smart pre-push hook detects which paths changed and only runs relevant tests. GitHub Actions runs both platforms in parallel on every push to main.

**Tech Stack:** jest, @testing-library/react (web), jest-expo + @testing-library/react-native (mobile, already set up), Husky pre-push hook, GitHub Actions

**Design doc:** `docs/plans/2026-02-24-tdd-enforcement-design.md`

---

## Task 1: Install web test dependencies

**Files:**
- Modify: `package.json` (root)
- Create: `jest.config.ts` (root)
- Create: `jest.setup.ts` (root)

**Step 1: Install packages**

```bash
npm install --save-dev jest jest-environment-jsdom @testing-library/react@^14 @testing-library/user-event @types/jest
```

Note: Use `@testing-library/react@^14` — the web app uses React 18. v15+ requires React 19.

Expected: packages installed, `package.json` devDependencies updated.

**Step 2: Add test script to root `package.json`**

In the `"scripts"` block, add:
```json
"test": "jest",
"test:watch": "jest --watch"
```

**Step 3: Create `jest.config.ts` at the repo root**

```ts
const nextJest = require('next/jest');
const createJestConfig = nextJest({ dir: './' });

module.exports = createJestConfig({
  testEnvironment: 'jest-environment-jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  moduleNameMapper: { '^@/(.*)$': '<rootDir>/src/$1' },
  testMatch: ['**/src/__tests__/**/*.test.[jt]s?(x)'],
});
```

`next/jest` handles TypeScript transforms, CSS modules, and Next.js internals automatically — no additional babel config needed.

**Step 4: Create `jest.setup.ts` at the repo root**

```ts
// Supabase client (web uses createClient() factory, not a singleton)
const makeSupabaseBuilder = () => {
  const builder: any = {
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    neq: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    in: jest.fn().mockReturnThis(),
    filter: jest.fn().mockReturnThis(),
    single: jest.fn().mockResolvedValue({ data: null, error: null }),
    maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
    insert: jest.fn().mockResolvedValue({ data: null, error: null }),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    then: (resolve: (val: any) => any) =>
      Promise.resolve({ data: [], error: null }).then(resolve),
  };
  return builder;
};

jest.mock('@/lib/supabase/client', () => ({
  createClient: jest.fn(() => ({
    from: jest.fn(() => makeSupabaseBuilder()),
    rpc: jest.fn().mockResolvedValue({ data: [], error: null }),
    auth: {
      getSession: jest.fn().mockResolvedValue({ data: { session: null }, error: null }),
      onAuthStateChange: jest.fn(() => ({
        data: { subscription: { unsubscribe: jest.fn() } },
      })),
    },
  })),
}));

// next/navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(() => ({ push: jest.fn(), back: jest.fn(), replace: jest.fn() })),
  usePathname: jest.fn(() => '/'),
  useSearchParams: jest.fn(() => new URLSearchParams()),
  redirect: jest.fn(),
  notFound: jest.fn(),
}));

// next/headers (server-side, needed if any server util is imported transitively)
jest.mock('next/headers', () => ({
  cookies: jest.fn(() => ({ get: jest.fn(), set: jest.fn(), delete: jest.fn() })),
  headers: jest.fn(() => ({ get: jest.fn() })),
}));

// Suppress console.error for expected test errors
const originalConsoleError = console.error;
beforeEach(() => {
  jest.clearAllMocks();
  console.error = jest.fn();
});
afterEach(() => {
  console.error = originalConsoleError;
});
```

**Step 5: Verify setup works with no tests yet**

```bash
npm test -- --passWithNoTests
```

Expected output:
```
No tests found, exiting with code 0
```

If you get a config error, check `jest.config.ts` — the `next/jest` module must be available (it comes with `next` which is already installed).

**Step 6: Commit**

```bash
git add package.json package-lock.json jest.config.ts jest.setup.ts
git commit -m "test: add web jest infrastructure with next/jest"
```

---

## Task 2: ActivityFeed crash tests (RED)

**Files:**
- Create: `src/__tests__/activity-feed-crash.test.tsx`

**Step 1: Create the test directory**

```bash
mkdir -p src/__tests__
```

**Step 2: Write the failing tests**

Create `src/__tests__/activity-feed-crash.test.tsx`:

```tsx
/**
 * Crash-prevention tests for ActivityFeed.
 *
 * Bug: item.display_name[0]?.toUpperCase() crashes when display_name is null
 * because null[0] throws TypeError before ?. can run.
 * Same bug was fixed on mobile in app/(tabs)/index.tsx.
 *
 * Fix: (item.display_name?.[0] ?? '?').toUpperCase()
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import { ActivityFeed } from '@/app/(authenticated)/home/activity-feed';

type FeedItem = {
  event_type: string;
  user_id: string;
  recipe_id: string;
  event_at: string;
  notes: string | null;
  display_name: string | null;
  avatar_url: string | null;
  recipe_title: string;
  recipe_image_url: string | null;
  source_url: string | null;
  source_name: string | null;
  rating: number | null;
  recipe_visibility: string;
  recipe_source_type: string;
};

function makeFeedItem(overrides: Partial<FeedItem> = {}): FeedItem {
  return {
    event_type: 'cooked',
    user_id: 'user-1',
    recipe_id: 'recipe-1',
    event_at: new Date().toISOString(),
    notes: null,
    display_name: 'Chef Bart',
    avatar_url: null,
    recipe_title: 'Pasta Carbonara',
    recipe_image_url: null,
    source_url: null,
    source_name: null,
    rating: null,
    recipe_visibility: 'public',
    recipe_source_type: 'manual',
    ...overrides,
  };
}

describe('ActivityFeed — null display_name crash', () => {
  it('renders without crashing when display_name is null', () => {
    render(
      <ActivityFeed
        initialItems={[makeFeedItem({ display_name: null })]}
        userId="user-1"
        hasMore={false}
      />
    );
    // If we get here, no crash
    expect(true).toBe(true);
  });

  it('renders without crashing when display_name is undefined', () => {
    render(
      <ActivityFeed
        initialItems={[makeFeedItem({ display_name: undefined as any })]}
        userId="user-1"
        hasMore={false}
      />
    );
    expect(true).toBe(true);
  });

  it('shows a fallback character when display_name is null (no crash)', () => {
    render(
      <ActivityFeed
        initialItems={[makeFeedItem({ display_name: null })]}
        userId="user-1"
        hasMore={false}
      />
    );
    // Fixed code renders '?' as fallback initial
    expect(screen.getByText('?')).not.toBeNull();
  });

  it('renders the recipe title even when display_name is null', () => {
    render(
      <ActivityFeed
        initialItems={[makeFeedItem({ display_name: null, recipe_title: 'Pasta Carbonara' })]}
        userId="user-1"
        hasMore={false}
      />
    );
    expect(screen.getByText('Pasta Carbonara')).not.toBeNull();
  });

  it('renders an empty feed without crashing', () => {
    render(<ActivityFeed initialItems={[]} userId="user-1" hasMore={false} />);
    expect(true).toBe(true);
  });

  it('renders multiple items where some have null display_name', () => {
    render(
      <ActivityFeed
        initialItems={[
          makeFeedItem({ display_name: 'Alice', recipe_title: 'Risotto' }),
          makeFeedItem({ display_name: null, recipe_title: 'Pasta' }),
          makeFeedItem({ display_name: 'Bob', recipe_title: 'Soup' }),
        ]}
        userId="user-1"
        hasMore={false}
      />
    );
    expect(screen.getByText('Risotto')).not.toBeNull();
    expect(screen.getByText('Pasta')).not.toBeNull();
    expect(screen.getByText('Soup')).not.toBeNull();
  });

  it('handles null rating without crashing', () => {
    render(
      <ActivityFeed
        initialItems={[makeFeedItem({ rating: null, event_type: 'cooked' })]}
        userId="user-1"
        hasMore={false}
      />
    );
    expect(true).toBe(true);
  });

  it('handles null source_url and source_name without crashing', () => {
    render(
      <ActivityFeed
        initialItems={[makeFeedItem({ source_url: null, source_name: null })]}
        userId="user-1"
        hasMore={false}
      />
    );
    expect(true).toBe(true);
  });
});
```

**Step 3: Run tests — verify they FAIL**

```bash
npm test -- --testPathPattern="activity-feed-crash" --verbose
```

Expected: Tests 1 and 2 (and possibly 3) **fail** with:
```
TypeError: Cannot read properties of null (reading '0')
```

If ALL tests pass immediately — the bug is already fixed and you should still keep the tests. If NO tests fail, check that `ActivityFeed` is actually being imported (no typo in path).

**Step 4: Commit the failing tests**

```bash
git add src/__tests__/activity-feed-crash.test.tsx
git commit -m "test(web): add failing crash tests for ActivityFeed null display_name"
```

---

## Task 3: Fix ActivityFeed crash (GREEN)

**Files:**
- Modify: `src/app/(authenticated)/home/activity-feed.tsx:134`

**Step 1: Open `activity-feed.tsx` and find line 134**

Look for this pattern (inside the avatar fallback `<div>`):
```tsx
{item.display_name[0]?.toUpperCase()}
```

**Step 2: Apply the fix**

Change it to:
```tsx
{(item.display_name?.[0] ?? '?').toUpperCase()}
```

The bug: `item.display_name[0]` throws before `?.` runs when `display_name` is `null`. The fix moves the optional chaining to the property access itself.

**Step 3: Run tests — verify they PASS**

```bash
npm test -- --testPathPattern="activity-feed-crash" --verbose
```

Expected: All 8 tests **pass**.

**Step 4: Run all web tests to check nothing else broke**

```bash
npm test -- --ci
```

Expected: All pass.

**Step 5: Commit**

```bash
git add src/app/\(authenticated\)/home/activity-feed.tsx src/__tests__/activity-feed-crash.test.tsx
git commit -m "fix(web): guard display_name null access in ActivityFeed avatar initial"
```

---

## Task 4: ChefCard crash tests (RED)

**Files:**
- Create: `src/__tests__/chef-card-crash.test.tsx`

**Step 1: Write the failing tests**

Create `src/__tests__/chef-card-crash.test.tsx`:

```tsx
/**
 * Crash-prevention tests for ChefCard.
 *
 * Bug: displayName[0]?.toUpperCase() crashes when displayName is an empty string
 * or null because the optional chaining is after the index access.
 * Same pattern as ActivityFeed.
 *
 * Fix: (displayName?.[0] ?? '?').toUpperCase()
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import { ChefCard } from '@/app/(authenticated)/discover/chef-card';

// ChefCard imports server actions — mock them
jest.mock('@/app/(authenticated)/profile/actions', () => ({
  followUser: jest.fn().mockResolvedValue(undefined),
  unfollowUser: jest.fn().mockResolvedValue(undefined),
}));

// Note: the mock path uses @/ alias which maps to src/
// This covers the relative import in chef-card.tsx

describe('ChefCard — display_name crash', () => {
  const defaultProps = {
    id: 'chef-1',
    displayName: 'Chef Bart',
    avatarUrl: null,
    recipeCount: 5,
    lastCooked: null,
    followState: 'not_following' as const,
  };

  it('renders without crashing when displayName is an empty string', () => {
    render(<ChefCard {...defaultProps} displayName="" />);
    expect(true).toBe(true);
  });

  it('renders the follow button', () => {
    render(<ChefCard {...defaultProps} />);
    expect(screen.getByRole('button', { name: /follow/i })).not.toBeNull();
  });

  it('renders recipe count correctly', () => {
    render(<ChefCard {...defaultProps} recipeCount={7} />);
    expect(screen.getByText('7 recipes')).not.toBeNull();
  });

  it('renders without crashing when lastCooked is null', () => {
    render(<ChefCard {...defaultProps} lastCooked={null} />);
    expect(true).toBe(true);
  });

  it('renders avatar initial from displayName when avatarUrl is null', () => {
    render(<ChefCard {...defaultProps} displayName="Bart" avatarUrl={null} />);
    expect(screen.getByText('B')).not.toBeNull();
  });
});
```

**Step 2: Run tests — verify they FAIL**

```bash
npm test -- --testPathPattern="chef-card-crash" --verbose
```

Expected: Test 1 ("empty string") **fails** with TypeError. Tests 2-5 may pass or fail depending on whether React throws during render.

If the mock for `@/app/(authenticated)/profile/actions` causes a module resolution error, check that the path `src/app/(authenticated)/profile/actions` exists (it's imported in chef-card.tsx as a relative path — jest resolves it via the moduleNameMapper).

**Step 3: Commit the failing tests**

```bash
git add src/__tests__/chef-card-crash.test.tsx
git commit -m "test(web): add failing crash tests for ChefCard empty displayName"
```

---

## Task 5: Fix ChefCard crash (GREEN)

**Files:**
- Modify: `src/app/(authenticated)/discover/chef-card.tsx:64`

**Step 1: Find line 64 in `chef-card.tsx`**

Look for this pattern (inside the avatar fallback `<div>`):
```tsx
{displayName[0]?.toUpperCase()}
```

**Step 2: Apply the fix**

```tsx
{(displayName?.[0] ?? '?').toUpperCase()}
```

Same fix as ActivityFeed.

**Step 3: Run tests — verify they PASS**

```bash
npm test -- --testPathPattern="chef-card-crash" --verbose
```

Expected: All 5 tests **pass**.

**Step 4: Run all web tests**

```bash
npm test -- --ci
```

Expected: All 13 tests pass.

**Step 5: Commit**

```bash
git add src/app/\(authenticated\)/discover/chef-card.tsx src/__tests__/chef-card-crash.test.tsx
git commit -m "fix(web): guard displayName null access in ChefCard avatar initial"
```

---

## Task 6: Pre-push hook

**Files:**
- Create: `.husky/pre-push`

**Step 1: Create the hook file**

Create `.husky/pre-push` with this content:

```bash
#!/usr/bin/env sh
. "$(dirname "$0")/_/husky.sh"

# Detect which paths changed vs remote main.
# Falls back to HEAD^..HEAD if no upstream is set (e.g. first push of a branch).
CHANGED=$(git diff --name-only origin/main...HEAD 2>/dev/null \
  || git diff --name-only HEAD^ HEAD 2>/dev/null \
  || echo "")

FAILED=false

if echo "$CHANGED" | grep -qE "^mobile/"; then
  echo "→ Mobile changes detected, running mobile tests..."
  (cd mobile && npm test -- --passWithNoTests) || FAILED=true
fi

if echo "$CHANGED" | grep -qE "^src/"; then
  echo "→ Web changes detected, running web tests..."
  npm test -- --passWithNoTests || FAILED=true
fi

[ "$FAILED" = true ] && { echo "Tests failed. Fix before pushing."; exit 1; }
echo "All tests passed."
```

**Step 2: Make it executable**

```bash
chmod +x .husky/pre-push
```

**Step 3: Verify Husky is wired up**

```bash
cat .husky/_/husky.sh
```

Expected: a short shell script (Husky's bootstrap). If this file doesn't exist, run `npx husky install` first.

**Step 4: Test the hook manually**

```bash
bash .husky/pre-push
```

Expected:
- If you have uncommitted src/ or mobile/ changes relative to origin/main: the relevant tests run
- If there are no relevant changes: "All tests passed." with no tests run

**Step 5: Commit**

```bash
git add .husky/pre-push
git commit -m "ci: add pre-push hook to run tests for changed platforms"
```

---

## Task 7: GitHub Actions CI workflow

**Files:**
- Create: `.github/workflows/test.yml`

**Step 1: Create the workflow**

Create `.github/workflows/test.yml`:

```yaml
name: Tests

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test-web:
    name: Web tests
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm

      - name: Install dependencies
        run: npm ci

      - name: Run tests
        run: npm test -- --ci

  test-mobile:
    name: Mobile tests
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
          cache-dependency-path: mobile/package-lock.json

      - name: Install dependencies
        working-directory: mobile
        run: npm ci

      - name: Run tests
        working-directory: mobile
        run: npm test -- --ci
```

`--ci` flag: disables interactive watch mode, fails fast, treats new snapshots as errors.

**Step 2: Commit and push**

```bash
git add .github/workflows/test.yml
git commit -m "ci: add parallel web + mobile test jobs to GitHub Actions"
git push
```

**Step 3: Verify CI runs**

Go to the GitHub repo → Actions tab. You should see a new "Tests" workflow run triggered by the push. Both `test-web` and `test-mobile` jobs should run in parallel and pass.

If either job fails, check the error output — common issues:
- `npm ci` fails: `package-lock.json` missing or out of sync — run `npm install` locally and commit the lock file
- jest config error: check `jest.config.ts` is being found from the correct working directory
- Module resolution error: check `moduleNameMapper` in `jest.config.ts`

**Step 4: Enable branch protection (manual GitHub setting)**

In GitHub repo → Settings → Branches → Add rule for `main`:
- Check "Require status checks to pass before merging"
- Search for and add: `test-web`, `test-mobile`

This is a one-time repo configuration, not in code.

---

## Verification Checklist

Run these before declaring done:

```bash
# All web tests pass
npm test -- --ci

# All mobile tests pass
cd mobile && npm test -- --ci && cd ..

# Pre-push hook works
bash .husky/pre-push

# Check test counts
npm test -- --verbose 2>&1 | grep "Tests:"
cd mobile && npm test -- --verbose 2>&1 | grep "Tests:" && cd ..
```

Expected final state:
- Web: 13 tests passing
- Mobile: 33 tests passing
- Pre-push hook: blocks on failures, passes with clean code
- CI: two green jobs in GitHub Actions
