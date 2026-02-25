# TDD Enforcement — Design

**Date:** 2026-02-24
**Scope:** Both platforms (web + mobile)
**Goal:** Prevent untested, crash-prone code from reaching the build

---

## Problem

Three crash categories hit production iOS before being caught:
- Null access on `display_name[0]` (home feed ticker, public profile)
- Undefined stats properties from RPC responses
- Missing try/catch in async load functions

The same `display_name[0]` bug exists verbatim on web (`activity-feed.tsx`, `chef-card.tsx`). No enforcement gate exists on either platform to catch these before they ship.

---

## Decisions

- **Enforcement:** Pre-push hook (local) + GitHub Actions CI (remote)
- **Web tests:** Jest + @testing-library/react, component tests matching mobile pattern
- **Hook strategy:** Smart — detects changed paths, only runs relevant tests
- **CI strategy:** Both platforms always run in parallel

---

## Architecture

```
git push
  │
  ▼
.husky/pre-push
  • git diff origin/main...HEAD to detect changed paths
  • mobile/** changed → cd mobile && npm test
  • src/** changed    → npm test (root)
  • blocks push on failure
  │
  ▼
GitHub Actions: test.yml
  • Triggers: push to main, PRs to main
  • Two parallel jobs: test-web + test-mobile
  • Branch protection on main requires both to pass
```

---

## What Gets Created

| File | Purpose |
|---|---|
| `.husky/pre-push` | Smart pre-push hook |
| `.github/workflows/test.yml` | Parallel CI jobs for web + mobile |
| `jest.config.ts` (root) | Web jest config via `next/jest` helper |
| `jest.setup.ts` (root) | Web mocks: Supabase, next/navigation, next/headers |
| `src/__tests__/activity-feed-crash.test.tsx` | 8 crash-prevention tests |
| `src/__tests__/chef-card-crash.test.tsx` | 5 crash-prevention tests |

Mobile test infrastructure already exists (`jest.config.js`, `jest.setup.ts`, 33 tests).

---

## Web Test Infrastructure

Root-level jest using Next.js built-in helper:

```ts
// jest.config.ts
const nextJest = require('next/jest')
const createJestConfig = nextJest({ dir: './' })

module.exports = createJestConfig({
  testEnvironment: 'jest-environment-jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  moduleNameMapper: { '^@/(.*)$': '<rootDir>/src/$1' },
  testMatch: ['**/src/__tests__/**/*.test.[jt]s?(x)'],
})
```

New devDependencies in root `package.json`:
```
jest  jest-environment-jsdom  @testing-library/react
@testing-library/user-event  @types/jest
```

`next/jest` handles babel, TypeScript transforms, and CSS modules — no extra config needed.

**Constraint:** Only `'use client'` components can be rendered in unit tests. Server components are covered by Vercel preview deploys.

---

## Web Test Targets

### `src/__tests__/activity-feed-crash.test.tsx`

Target: `activity-feed.tsx` — same `display_name[0]?.toUpperCase()` null crash as mobile.

Tests:
1. renders without crashing when display_name is null
2. renders without crashing when display_name is undefined
3. shows fallback when display_name is null (no crash)
4. renders recipe title even when display_name is null
5. renders empty feed without crashing
6. renders multiple items where some have null display_name
7. handles null rating without crashing
8. handles null source_url and source_name without crashing

### `src/__tests__/chef-card-crash.test.tsx`

Target: `chef-card.tsx` — same `displayName[0]?.toUpperCase()` crash.

Tests:
1. renders without crashing when displayName is an empty string
2. renders follow button correctly
3. renders recipe count correctly
4. renders without crashing when lastCooked is null
5. renders avatar initial when avatarUrl is null

**Note:** These tests will surface the existing `display_name[0]` bugs on web. Fix comes with the test per TDD.

---

## Pre-push Hook

```bash
#!/usr/bin/env sh
. "$(dirname "$0")/_/husky.sh"

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

[ "$FAILED" = true ] && exit 1
echo "All tests passed."
```

`--passWithNoTests` handles new branches with no matching test files yet.

---

## CI Workflow

```yaml
name: Tests
on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test-web:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: npm }
      - run: npm ci
      - run: npm test -- --ci

  test-mobile:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: npm,
                cache-dependency-path: mobile/package-lock.json }
      - run: npm ci
        working-directory: mobile
      - run: npm test -- --ci
        working-directory: mobile
```

Both jobs run in parallel. `--ci` mode: no interactive prompts, fails fast.

**Post-setup:** Enable branch protection on `main` in GitHub repo settings — require both `test-web` and `test-mobile` to pass before merge.

---

## Result

After implementation:
- 46 tests total (33 mobile + 13 web)
- Pre-push blocks broken code before it reaches the repo
- CI blocks merges to main if tests fail
- Web bugs identical to the mobile crashes that were just fixed are caught and fixed
