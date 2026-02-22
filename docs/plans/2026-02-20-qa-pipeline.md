# QA Pipeline Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a 3-phase QA pipeline: pre-commit hooks (lint + typecheck), GitHub Actions CI (build + typecheck + lint + migration check), and selective automated tests (unit tests for parsers, Playwright E2E for critical paths).

**Architecture:** Pre-commit hooks catch errors locally before push. GitHub Actions runs the full suite on every push/PR as a deployment gate. Vitest handles unit tests for pure-logic parsing modules. Playwright handles 5 critical web flows. Supabase CLI validates migrations apply cleanly.

**Tech Stack:** Husky, lint-staged, GitHub Actions, Vitest, Playwright, Supabase CLI

---

## Phase 1: Pre-commit Hooks

### Task 1: Install Husky and lint-staged

**Files:**
- Modify: `package.json` (add devDependencies and lint-staged config)

**Step 1: Install dependencies**

Run:
```bash
npm install --save-dev husky lint-staged
```

**Step 2: Initialize Husky**

Run:
```bash
npx husky init
```
Expected: Creates `.husky/` directory with a `pre-commit` hook file.

**Step 3: Configure the pre-commit hook**

Write `.husky/pre-commit`:
```bash
npx lint-staged
```

**Step 4: Add lint-staged config to package.json**

Add to `package.json`:
```json
{
  "lint-staged": {
    "src/**/*.{ts,tsx}": [
      "eslint --max-warnings=0"
    ]
  }
}
```

Note: We only lint `src/` (web) because mobile has no ESLint config. TypeScript checking is handled separately in the next task.

**Step 5: Verify it works**

Run:
```bash
git stash && echo "const x: number = 'bad'" > /tmp/test-lint.ts && git add /tmp/test-lint.ts || true
```
Then:
```bash
npx lint-staged --verbose
```
Expected: lint-staged runs ESLint on staged files. Clean up the test file after.

**Step 6: Commit**

```bash
git add package.json package-lock.json .husky/
git commit -m "chore: add husky + lint-staged pre-commit hooks"
```

---

### Task 2: Add typecheck scripts for web and mobile

**Files:**
- Modify: `package.json` (add typecheck script)
- Modify: `mobile/package.json` (add typecheck script)
- Modify: `.husky/pre-commit` (add typecheck step)

**Step 1: Add typecheck script to web package.json**

Add to `package.json` scripts:
```json
"typecheck": "tsc --noEmit"
```

**Step 2: Add typecheck script to mobile package.json**

Add to `mobile/package.json` scripts:
```json
"typecheck": "tsc --noEmit"
```

**Step 3: Verify both typecheck scripts work**

Run from project root:
```bash
npm run typecheck
```
Expected: Exits 0 (no type errors) or reports existing type errors that need fixing.

Run for mobile:
```bash
cd mobile && npm run typecheck
```
Expected: Same — clean exit or existing errors. Fix any errors before proceeding.

**Step 4: Add typecheck to pre-commit hook**

Update `.husky/pre-commit`:
```bash
npx lint-staged
npm run typecheck
```

Note: We run full `tsc --noEmit` rather than only checking staged files because TypeScript errors can cascade — changing one file can break another. This takes ~3-5 seconds which is acceptable.

We do NOT add mobile typecheck to pre-commit (too slow and mobile is a separate package). Mobile gets checked in CI (Phase 2).

**Step 5: Commit**

```bash
git add package.json mobile/package.json .husky/pre-commit
git commit -m "chore: add typecheck scripts for web and mobile"
```

---

## Phase 2: GitHub Actions CI

### Task 3: Create CI workflow for web

**Files:**
- Create: `.github/workflows/ci.yml`

**Step 1: Create the workflow file**

Write `.github/workflows/ci.yml`:
```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true

jobs:
  web:
    name: Web — Lint, Typecheck, Build
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm

      - name: Install dependencies
        run: npm ci

      - name: Lint
        run: npm run lint

      - name: Typecheck
        run: npm run typecheck

      - name: Build
        run: npm run build
        env:
          NEXT_PUBLIC_SUPABASE_URL: https://placeholder.supabase.co
          NEXT_PUBLIC_SUPABASE_ANON_KEY: placeholder

  mobile:
    name: Mobile — Typecheck
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: mobile
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
          cache-dependency-path: mobile/package-lock.json

      - name: Install dependencies
        run: npm ci

      - name: Typecheck
        run: npm run typecheck
```

Note: The `build` step uses placeholder env vars because Next.js requires `NEXT_PUBLIC_SUPABASE_URL` at build time for the client bundle. The actual values don't matter for build validation — we just need it to compile. Concurrency settings cancel in-progress runs when a new push arrives, saving CI minutes.

**Step 2: Verify the workflow file is valid YAML**

Run:
```bash
cat .github/workflows/ci.yml | python3 -c "import sys, yaml; yaml.safe_load(sys.stdin); print('Valid YAML')"
```
Expected: "Valid YAML"

**Step 3: Commit**

```bash
git add .github/workflows/ci.yml
git commit -m "ci: add GitHub Actions workflow for web and mobile"
```

---

### Task 4: Add Supabase migration check to CI

**Files:**
- Modify: `.github/workflows/ci.yml` (add migrations job)

**Step 1: Add migrations job to the workflow**

Add a new job to `.github/workflows/ci.yml`:
```yaml
  migrations:
    name: Database — Validate Migrations
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: supabase/setup-cli@v1
        with:
          version: latest

      - name: Start local Supabase
        run: supabase start -x realtime,storage,imgproxy,edge-runtime,logflare,vector,supavisor

      - name: Validate migrations apply cleanly
        run: supabase db reset

      - name: Stop Supabase
        run: supabase stop
```

Note: The `-x` flag excludes unnecessary services (realtime, storage, etc.) to speed up startup. We only need the database to validate migrations. `supabase db reset` drops and recreates the database, then applies all migrations sequentially — if any migration has a syntax error or dependency issue, this fails.

**Step 2: Fix duplicate migration version number**

There are two migrations with version `20240101000037`:
- `20240101000037_fix_profile_timestamps.sql`
- `20240101000037_social_defaults_and_feed.sql`

Rename one to avoid conflicts:
```bash
mv supabase/migrations/20240101000037_social_defaults_and_feed.sql supabase/migrations/20240101000038_social_defaults_and_feed.sql
```

**Step 3: Commit**

```bash
git add .github/workflows/ci.yml supabase/migrations/
git commit -m "ci: add Supabase migration validation to CI"
```

---

## Phase 3: Automated Tests

### Task 5: Set up Vitest

**Files:**
- Modify: `package.json` (add vitest)
- Create: `vitest.config.ts`

**Step 1: Install Vitest**

Run:
```bash
npm install --save-dev vitest
```

**Step 2: Create Vitest config**

Write `vitest.config.ts`:
```typescript
import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    include: ["src/**/*.test.ts"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
```

**Step 3: Add test script to package.json**

Add to `package.json` scripts:
```json
"test": "vitest run",
"test:watch": "vitest"
```

**Step 4: Commit**

```bash
git add package.json package-lock.json vitest.config.ts
git commit -m "chore: add Vitest test framework"
```

---

### Task 6: Unit tests for ingredient-parser

**Files:**
- Create: `src/lib/__tests__/ingredient-parser.test.ts`

**Step 1: Write the tests**

Write `src/lib/__tests__/ingredient-parser.test.ts`:
```typescript
import { describe, it, expect } from "vitest";
import { parseIngredient } from "../ingredient-parser";

describe("parseIngredient", () => {
  it("parses simple ingredient with quantity and unit", () => {
    const result = parseIngredient("2 cups flour");
    expect(result).toEqual({
      quantity: 2,
      unit: "cups",
      ingredient_name: "flour",
      notes: "",
    });
  });

  it("parses fractional quantity with unicode", () => {
    const result = parseIngredient("½ tsp salt");
    expect(result).toEqual({
      quantity: 0.5,
      unit: "tsp",
      ingredient_name: "salt",
      notes: "",
    });
  });

  it("parses mixed number with unicode fraction", () => {
    const result = parseIngredient("1½ cups sugar");
    expect(result).toEqual({
      quantity: 1.5,
      unit: "cups",
      ingredient_name: "sugar",
      notes: "",
    });
  });

  it("parses slash fraction", () => {
    const result = parseIngredient("1/4 cup olive oil");
    expect(result).toEqual({
      quantity: 0.25,
      unit: "cup",
      ingredient_name: "olive oil",
      notes: "",
    });
  });

  it("extracts notes from comma", () => {
    const result = parseIngredient("2 cloves garlic, minced");
    expect(result).toEqual({
      quantity: 2,
      unit: "cloves",
      ingredient_name: "garlic",
      notes: "minced",
    });
  });

  it("extracts notes from parentheses", () => {
    const result = parseIngredient("1 cup butter (softened)");
    expect(result).toEqual({
      quantity: 1,
      unit: "cup",
      ingredient_name: "butter",
      notes: "softened",
    });
  });

  it("handles ingredient with no quantity", () => {
    const result = parseIngredient("salt and pepper to taste");
    expect(result).toEqual({
      quantity: null,
      unit: "",
      ingredient_name: "salt and pepper to taste",
      notes: "",
    });
  });

  it("handles ingredient with quantity but no unit", () => {
    const result = parseIngredient("3 eggs");
    expect(result).toEqual({
      quantity: 3,
      unit: "",
      ingredient_name: "eggs",
      notes: "",
    });
  });

  it("handles decimal quantity", () => {
    const result = parseIngredient("1.5 lbs chicken");
    expect(result).toEqual({
      quantity: 1.5,
      unit: "lbs",
      ingredient_name: "chicken",
      notes: "",
    });
  });

  it("handles grams", () => {
    const result = parseIngredient("200 g dark chocolate");
    expect(result).toEqual({
      quantity: 200,
      unit: "g",
      ingredient_name: "dark chocolate",
      notes: "",
    });
  });
});
```

**Step 2: Run tests to verify they pass**

Run:
```bash
npm test -- src/lib/__tests__/ingredient-parser.test.ts
```
Expected: All 10 tests pass.

**Step 3: Commit**

```bash
git add src/lib/__tests__/ingredient-parser.test.ts
git commit -m "test: add unit tests for ingredient parser"
```

---

### Task 7: Unit tests for duration-parser

**Files:**
- Create: `src/lib/__tests__/duration-parser.test.ts`

**Step 1: Write the tests**

Write `src/lib/__tests__/duration-parser.test.ts`:
```typescript
import { describe, it, expect } from "vitest";
import { parseDuration } from "../duration-parser";

describe("parseDuration", () => {
  it("parses minutes only", () => {
    expect(parseDuration("PT30M")).toBe(30);
  });

  it("parses hours only", () => {
    expect(parseDuration("PT2H")).toBe(120);
  });

  it("parses hours and minutes", () => {
    expect(parseDuration("PT1H15M")).toBe(75);
  });

  it("parses with day prefix", () => {
    expect(parseDuration("P0DT1H30M")).toBe(90);
  });

  it("returns null for null input", () => {
    expect(parseDuration(null)).toBeNull();
  });

  it("returns null for undefined input", () => {
    expect(parseDuration(undefined)).toBeNull();
  });

  it("returns null for empty string", () => {
    expect(parseDuration("")).toBeNull();
  });

  it("returns null for invalid format", () => {
    expect(parseDuration("30 minutes")).toBeNull();
  });

  it("returns null for zero duration", () => {
    expect(parseDuration("PT0M")).toBeNull();
  });
});
```

**Step 2: Run tests**

Run:
```bash
npm test -- src/lib/__tests__/duration-parser.test.ts
```
Expected: All 9 tests pass.

**Step 3: Commit**

```bash
git add src/lib/__tests__/duration-parser.test.ts
git commit -m "test: add unit tests for duration parser"
```

---

### Task 8: Unit tests for source-name

**Files:**
- Create: `src/lib/__tests__/source-name.test.ts`

**Step 1: Write the tests**

Write `src/lib/__tests__/source-name.test.ts`:
```typescript
import { describe, it, expect } from "vitest";
import { getSourceNameFromUrl, getInstagramHandle } from "../source-name";

describe("getSourceNameFromUrl", () => {
  it("maps known domains", () => {
    expect(getSourceNameFromUrl("https://www.seriouseats.com/recipe/123")).toBe("Serious Eats");
    expect(getSourceNameFromUrl("https://cooking.nytimes.com/recipes/456")).toBe("NYT Cooking");
    expect(getSourceNameFromUrl("https://www.bonappetit.com/recipe/test")).toBe("Bon Appetit");
  });

  it("strips www prefix", () => {
    expect(getSourceNameFromUrl("https://www.epicurious.com/recipe")).toBe("Epicurious");
  });

  it("handles subdomains", () => {
    expect(getSourceNameFromUrl("https://cooking.nytimes.com/recipes/123")).toBe("NYT Cooking");
  });

  it("falls back to raw domain for unknown sites", () => {
    expect(getSourceNameFromUrl("https://www.myrecipes.example.com/recipe")).toBe("myrecipes.example.com");
  });

  it("returns url on invalid input", () => {
    expect(getSourceNameFromUrl("not a url")).toBe("not a url");
  });
});

describe("getInstagramHandle", () => {
  it("extracts handle from post URL", () => {
    expect(getInstagramHandle("https://www.instagram.com/p/ABC123/?img_index=1")).toBeNull();
  });

  it("extracts handle from profile URL", () => {
    expect(getInstagramHandle("https://www.instagram.com/chefname")).toBe("chefname");
  });

  it("returns null for explore URLs", () => {
    expect(getInstagramHandle("https://www.instagram.com/explore")).toBeNull();
  });
});
```

**Step 2: Run tests**

Run:
```bash
npm test -- src/lib/__tests__/source-name.test.ts
```
Expected: All tests pass.

**Step 3: Commit**

```bash
git add src/lib/__tests__/source-name.test.ts
git commit -m "test: add unit tests for source name extraction"
```

---

### Task 9: Unit tests for unit-conversion

**Files:**
- Create: `src/lib/__tests__/unit-conversion.test.ts`

**Step 1: Write the tests**

Write `src/lib/__tests__/unit-conversion.test.ts`:
```typescript
import { describe, it, expect } from "vitest";
import { convertIngredient, formatQuantity } from "../unit-conversion";

describe("convertIngredient", () => {
  it("converts cups to ml", () => {
    const result = convertIngredient(1, "cups", "metric");
    expect(result.unit).toBe("ml");
    expect(result.quantity).toBeCloseTo(236.59, 0);
  });

  it("converts oz to g", () => {
    const result = convertIngredient(8, "oz", "metric");
    expect(result.unit).toBe("g");
    expect(result.quantity).toBeCloseTo(226.8, 0);
  });

  it("converts g to oz (small amounts)", () => {
    const result = convertIngredient(100, "g", "imperial");
    expect(result.unit).toBe("oz");
    expect(result.quantity).toBeCloseTo(3.53, 0);
  });

  it("converts g to lb (large amounts)", () => {
    const result = convertIngredient(500, "g", "imperial");
    expect(result.unit).toBe("lb");
    expect(result.quantity).toBeCloseTo(1.1, 0);
  });

  it("returns unchanged for unknown units", () => {
    const result = convertIngredient(2, "cloves", "metric");
    expect(result).toEqual({ quantity: 2, unit: "cloves" });
  });

  it("returns unchanged for null quantity", () => {
    const result = convertIngredient(null, "cups", "metric");
    expect(result).toEqual({ quantity: null, unit: "cups" });
  });
});

describe("formatQuantity", () => {
  it("formats whole numbers", () => {
    expect(formatQuantity(2)).toBe("2");
  });

  it("formats common fractions with unicode", () => {
    expect(formatQuantity(0.5)).toBe("\u00BD");
    expect(formatQuantity(0.25)).toBe("\u00BC");
    expect(formatQuantity(0.75)).toBe("\u00BE");
  });

  it("formats mixed numbers", () => {
    expect(formatQuantity(1.5)).toBe("1\u00BD");
    expect(formatQuantity(2.25)).toBe("2\u00BC");
  });

  it("returns empty string for null", () => {
    expect(formatQuantity(null)).toBe("");
  });
});
```

**Step 2: Run tests**

Run:
```bash
npm test -- src/lib/__tests__/unit-conversion.test.ts
```
Expected: All tests pass.

**Step 3: Commit**

```bash
git add src/lib/__tests__/unit-conversion.test.ts
git commit -m "test: add unit tests for unit conversion"
```

---

### Task 10: Set up Playwright

**Files:**
- Modify: `package.json` (add Playwright)
- Create: `playwright.config.ts`
- Create: `e2e/auth.setup.ts`

**Step 1: Install Playwright**

Run:
```bash
npm install --save-dev @playwright/test
npx playwright install chromium
```

Note: We only install Chromium (not Firefox/WebKit) to keep CI fast. Cross-browser testing is overkill for this stage.

**Step 2: Create Playwright config**

Write `playwright.config.ts`:
```typescript
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? "github" : "html",
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3000",
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "setup",
      testMatch: /auth\.setup\.ts/,
    },
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        storageState: "e2e/.auth/user.json",
      },
      dependencies: ["setup"],
    },
  ],
});
```

**Step 3: Create auth setup file**

Write `e2e/auth.setup.ts`:
```typescript
import { test as setup, expect } from "@playwright/test";
import path from "path";

const authFile = path.join(__dirname, ".auth/user.json");

setup("authenticate", async ({ page }) => {
  await page.goto("/login");

  await page.getByLabel("Email").fill(process.env.PLAYWRIGHT_USER_EMAIL || "");
  await page.getByLabel("Password").fill(process.env.PLAYWRIGHT_USER_PASSWORD || "");
  await page.getByRole("button", { name: "Sign in" }).click();

  // Wait for redirect to authenticated area
  await page.waitForURL("**/home**");

  await page.context().storageState({ path: authFile });
});
```

**Step 4: Add auth state to .gitignore**

Append to `.gitignore`:
```
e2e/.auth/
```

**Step 5: Commit**

```bash
git add package.json package-lock.json playwright.config.ts e2e/auth.setup.ts .gitignore
git commit -m "chore: add Playwright E2E test framework"
```

---

### Task 11: Playwright E2E tests for critical paths

**Files:**
- Create: `e2e/smoke.test.ts`

**Step 1: Write the E2E smoke tests**

Write `e2e/smoke.test.ts`:
```typescript
import { test, expect } from "@playwright/test";

test.describe("Critical paths", () => {
  test("home page loads", async ({ page }) => {
    await page.goto("/home");
    // Should not redirect to login (auth setup handles this)
    await expect(page).toHaveURL(/.*home.*/);
  });

  test("recipes page loads and shows recipe list", async ({ page }) => {
    await page.goto("/recipes");
    await expect(page).toHaveURL(/.*recipes.*/);
    // Page should have the main heading or recipe content
    await expect(page.locator("main")).toBeVisible();
  });

  test("recipe import page loads", async ({ page }) => {
    await page.goto("/recipes/import");
    await expect(page).toHaveURL(/.*import.*/);
    await expect(page.locator("main")).toBeVisible();
  });

  test("profile page loads", async ({ page }) => {
    await page.goto("/profile");
    await expect(page).toHaveURL(/.*profile.*/);
    await expect(page.locator("main")).toBeVisible();
  });

  test("discover page loads", async ({ page }) => {
    await page.goto("/discover");
    await expect(page).toHaveURL(/.*discover.*/);
    await expect(page.locator("main")).toBeVisible();
  });
});
```

Note: These are smoke tests — they verify pages load without errors, not full user flows. This is intentional: at this stage we want to catch build regressions and broken routes, not test every interaction. More granular tests can be added incrementally as flows stabilize.

**Step 2: Add E2E script to package.json**

Add to `package.json` scripts:
```json
"test:e2e": "playwright test"
```

**Step 3: Test locally (requires running dev server and env vars)**

Run:
```bash
PLAYWRIGHT_USER_EMAIL=your@email.com PLAYWRIGHT_USER_PASSWORD=yourpassword npm run test:e2e
```
Expected: Tests run against localhost:3000. They'll fail if dev server isn't running — that's expected.

**Step 4: Commit**

```bash
git add e2e/smoke.test.ts package.json
git commit -m "test: add Playwright E2E smoke tests for critical paths"
```

---

### Task 12: Add tests to CI workflow

**Files:**
- Modify: `.github/workflows/ci.yml`

**Step 1: Add unit test step to web job**

Add after the "Build" step in the `web` job:
```yaml
      - name: Unit tests
        run: npm test
```

**Step 2: Add Playwright job**

Add a new job to the workflow:
```yaml
  e2e:
    name: Web — E2E Tests
    runs-on: ubuntu-latest
    needs: web
    if: github.event_name == 'pull_request'
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm

      - name: Install dependencies
        run: npm ci

      - name: Install Playwright browsers
        run: npx playwright install chromium --with-deps

      - name: Build
        run: npm run build
        env:
          NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.PLAYWRIGHT_SUPABASE_URL }}
          NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.PLAYWRIGHT_SUPABASE_ANON_KEY }}

      - name: Run E2E tests
        run: npx playwright test
        env:
          PLAYWRIGHT_BASE_URL: http://localhost:3000
          PLAYWRIGHT_USER_EMAIL: ${{ secrets.PLAYWRIGHT_USER_EMAIL }}
          PLAYWRIGHT_USER_PASSWORD: ${{ secrets.PLAYWRIGHT_USER_PASSWORD }}

      - uses: actions/upload-artifact@v4
        if: failure()
        with:
          name: playwright-report
          path: playwright-report/
          retention-days: 7
```

Note: E2E only runs on PRs (not every push to main) to save CI minutes. It requires GitHub Secrets for the Supabase test instance and test user credentials. The `needs: web` ensures we only run E2E if the build passes. Playwright report is uploaded as an artifact on failure for debugging.

**IMPORTANT:** Before this job works, you need to set these GitHub Secrets:
- `PLAYWRIGHT_SUPABASE_URL` — URL to a Supabase instance (can be same as prod for now, or a staging project)
- `PLAYWRIGHT_SUPABASE_ANON_KEY` — anon key for that instance
- `PLAYWRIGHT_USER_EMAIL` — email of a test user account
- `PLAYWRIGHT_USER_PASSWORD` — password for that test user

**Step 3: Commit**

```bash
git add .github/workflows/ci.yml
git commit -m "ci: add unit tests and Playwright E2E to CI pipeline"
```

---

### Task 13: Add lint-staged config for test files

**Files:**
- Modify: `package.json` (extend lint-staged)

**Step 1: Update lint-staged to run relevant tests on commit**

Update the `lint-staged` config in `package.json`:
```json
{
  "lint-staged": {
    "src/**/*.{ts,tsx}": [
      "eslint --max-warnings=0"
    ],
    "src/lib/**/*.ts": [
      "vitest related --run"
    ]
  }
}
```

Note: `vitest related --run` only runs tests that import the changed file. So if you edit `ingredient-parser.ts`, it runs `ingredient-parser.test.ts` automatically. This adds a few seconds to commit but catches regressions immediately.

**Step 2: Commit**

```bash
git add package.json
git commit -m "chore: run related unit tests in pre-commit hook"
```

---

## Summary

After all tasks are complete, the QA pipeline looks like this:

```
Developer edits code
        ↓
   git commit
        ↓
┌─── Pre-commit (local, ~10s) ───┐
│  ESLint (staged web files)      │
│  Related unit tests (if lib/)   │
│  TypeScript check (web)         │
└─────────────────────────────────┘
        ↓
   git push
        ↓
┌─── GitHub Actions CI (~3-5min) ─┐
│  Web: lint + typecheck + build   │
│  Web: unit tests (vitest)        │
│  Mobile: typecheck               │
│  DB: migration validation        │
│  E2E: Playwright (PRs only)      │
└──────────────────────────────────┘
        ↓
   Vercel deploy (if CI passes)
```
