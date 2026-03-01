# Cooking Mode — Design Document

> Status: Approved
> Date: 2026-02-28
> Platforms: Mobile (full spec), Web (sketch)
> Sprint: 1

---

## Overview

Cooking mode is the single feature that separates a kitchen app from a recipe website. It presents a recipe one step at a time, full-screen, with the screen kept awake — minimal UI, no distractions, messy-hands-friendly.

---

## Architecture

### Entry Point

A **"Start Cooking"** button on the recipe detail screen, placed below the metadata row (prep/cook time, servings). Free for all users — this is a core kitchen utility, not a premium feature.

### Mobile Architecture

Cooking mode is a **modal screen** that presents over the recipe detail. The recipe detail stays mounted underneath. The user can exit at any time and return to exactly where they were.

- Screen: `mobile/app/recipe/[id]/cooking.tsx`
- Component: `mobile/components/ui/CookingMode.tsx`
- Screen keep-awake: `expo-keep-awake` (Expo SDK, no config needed), activates on open, releases on exit

### Web Architecture (sketch)

A full-screen overlay (fixed-position, z-indexed above everything). Same cream background as the app. Entry: "Start Cooking" button on the recipe detail page.

- Component: `src/components/ui/CookingModeOverlay.tsx`
- Screen wake lock: Web Wake Lock API (`navigator.wakeLock.request('screen')`), with graceful degradation if unsupported
- Keyboard navigation: ← → to advance steps, Esc to exit (with confirmation if mid-cook)
- Respects `prefers-reduced-motion` for transitions

---

## Step Parsing

Instructions are stored as a single text field. Steps are parsed at runtime on cooking mode entry — no database change.

```ts
function parseSteps(instructions: string): string[] {
  return instructions
    .split(/\n+/)
    .map(s => s.replace(/^(step\s*)?\d+[.):\s]*/i, '').trim())
    .filter(Boolean);
}
```

Steps are stored in component state only. No persistence, no migration needed. Structured `recipe_steps` table deferred to Sprint 2 when per-step timers land.

---

## Screen Layout (Mobile)

### Header (fixed, top)
- **Exit button** (top-left, "×") — explicit only, no back-swipe (protects against accidental dismissal)
- **Recipe title** (center, truncated to one line)
- **Step counter** (top-right, e.g. "3 / 8")

### Segment Control (below header)
- Two tabs: **Steps** | **Ingredients**
- Tapping switches the body content
- Swipe left/right is **not** used for tab switching — reserved for step navigation

### Body (scrollable)

**Steps view:**
- Large muted step label ("Step 3")
- Step text in large, readable body size (~20–22px equivalent) — bigger than normal recipe text
- Single step only — no surrounding steps visible
- If a step is long, it scrolls vertically within the body

**Ingredients view:**
- Full scrollable ingredient list (same data as recipe detail, read-only)
- Unit system toggle (metric/imperial) preserved

### Progress Bar
- Thin line directly under the segment control
- Fills left-to-right as steps advance
- Not shown in Ingredients view

### Footer (fixed, bottom)
- **Previous** (ghost style) + **Next** (primary style) — both 44pt tap targets
- On step 1: Previous is hidden (not disabled)
- On last step: Next becomes **"Done"**

---

## Completion Flow

When the user taps **Done** on the last step, the modal transitions to a completion screen (same modal, no new screen):

- Heading: "You cooked it!"
- Subtitle: recipe title
- 1–5 star rating row (optional)
- Short notes field (optional)
- **Save & Finish** (primary) — writes to `recipe_ratings` with today's date, rating, and notes; dismisses modal
- **Skip** (ghost) — dismisses modal without writing

On exit (either path), the user lands on the recipe detail with any new rating reflected immediately.

> Product note: this is the highest-intent moment in the app — the user just finished cooking. A soft, non-gating prompt here is the best place to capture a rating.

---

## Data

No new database tables or migrations required.

| Data | Source | Action |
|------|--------|--------|
| Steps | `recipes.instructions` | Parse at runtime |
| Ingredients | `recipe_ingredients` | Read-only |
| Completion log | `recipe_ratings` | Insert on Save & Finish |

---

## Free vs Premium

Cooking mode is **free for all users**. It is the core kitchen utility — gating it would undermine the app's primary value proposition. Per-step timers (Sprint 2) will be evaluated for free/premium split separately.

---

## Out of Scope (Sprint 1)

- Per-step timers → Sprint 2 (`recipe_steps` table + timer UI)
- Voice control ("next step", "read ingredients") → backlog
- Structured `recipe_steps` DB table → Sprint 2
- Web full implementation → follow-up change after mobile ships
