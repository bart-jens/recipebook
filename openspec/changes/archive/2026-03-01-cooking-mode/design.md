## Context

EefEats has a recipe detail screen on both mobile and web. Instructions are stored as a single `text` field in `recipes.instructions`. Ingredients are structured in `recipe_ingredients`. Ratings are written to `recipe_ratings`.

The current detail view is a reading surface — scroll, consume, done. There is no way to follow a recipe step-by-step with the phone screen staying awake. Users must manually lock the screen to prevent sleep, tap through at awkward moments, and navigate back and forth between the recipe and the stove.

## Goals / Non-Goals

**Goals:**
- Full-screen step-by-step cooking view on mobile (primary)
- Screen keep-awake for the duration of cooking
- Ingredients always reachable without losing step context
- Soft rating capture at completion (highest-intent moment in the app)
- Web sketch: same feature, same entry point, keyboard navigation, Web Wake Lock API

**Non-Goals:**
- Per-step timers (Sprint 2 — requires `recipe_steps` table)
- Voice navigation ("next step", "read ingredients") — backlog
- Structured `recipe_steps` DB table — deferred to Sprint 2
- Offline support for cooking mode — addressed separately
- Any premium gating — cooking mode is free for all users

## Decisions

### Decision 1: Modal over pushed screen

Cooking mode opens as a **modal** (not a navigation stack push).

**Why**: A modal keeps the recipe detail mounted underneath. The user can dismiss cooking mode and return to the exact same scroll position in the recipe detail — essential when they need to re-read the ingredient list or check a note mid-cook. A push requires navigating back, which loses scroll position.

**Alternative considered**: Push with a "Back to Recipe" button. Rejected — this is a navigational dead end. The user is mid-cook; getting back to the detail should be one tap, not a navigation event.

**Mobile implementation**: Expo Router modal route at `mobile/app/recipe/[id]/cooking.tsx` with `presentation: 'fullScreenModal'`.

**Web implementation**: Fixed-position overlay div, z-indexed above all content, same cream background. Not a `<dialog>` element (poor browser support for full-screen modals).

---

### Decision 2: Runtime step parsing, no schema change

Steps are parsed from `recipes.instructions` at cooking mode entry. No new DB table in Sprint 1.

**Why**: The Sprint 1 scope explicitly excludes per-step timers — the only feature that requires step-level metadata. Migrating to a `recipe_steps` table without using its capabilities is premature. Every existing recipe already has instructions as text; runtime parsing works immediately with zero migration risk.

**Parse algorithm** (shared util — `src/lib/parse-steps.ts` + `mobile/lib/parse-steps.ts`):
```ts
export function parseSteps(instructions: string): string[] {
  return instructions
    .split(/\n+/)
    .map(s => s.replace(/^(step\s*)?\d+[.):\s]*/i, '').trim())
    .filter(Boolean);
}
```

Handles: numbered lists (`1. Boil water`), labelled steps (`Step 1: Boil water`), and bare newline-separated paragraphs.

**Sprint 2 migration path**: When per-step timers land, add `recipe_steps` table. On first cook of any recipe, detect if steps are already persisted; if not, parse + insert. No bulk backfill needed.

**Alternative considered**: Structured `recipe_steps` table now. Rejected — adds a migration, a backfill, and changes to all import pipelines for zero Sprint 1 benefit.

---

### Decision 3: Buttons only for step navigation; swipe reserved for segment toggle

Prev/Next buttons (44pt tap targets) are the only step navigation mechanism. Swipe left/right is **not** used for step navigation.

**Why**: Users cook with wet or greasy hands. Swipe gestures are unreliable under those conditions and produce accidental skips. Buttons are large, deliberate, and predictable.

Swipe is reserved for the Steps/Ingredients segment control, which is a lower-stakes toggle (can be undone by swiping back).

**Web equivalent**: Left/Right arrow keys advance steps. This is the natural keyboard analog.

---

### Decision 4: Completion prompt, not gate

The "Mark as Cooked" prompt appears after the last step but does not block exit. Both "Save & Finish" and "Skip" dismiss the modal.

**Why**: This is the highest-intent moment in the app — the user just finished cooking. A soft, non-blocking prompt captures ratings at the right moment without frustrating users who don't want to rate. Blocking exit would feel punitive and undermine trust.

**Data write**: Reuses the existing `recipe_ratings` insert. No new DB logic.

---

### Decision 5: `expo-keep-awake` on mobile, Web Wake Lock API on web

Both are the standard platform APIs for this. `expo-keep-awake` is already in the Expo SDK and requires zero native config. The Web Wake Lock API is supported in all modern browsers; graceful degradation (no error shown) if unavailable.

## Risks / Trade-offs

**Step parsing quality** → Some imported recipes have non-standard formatting (e.g., all instructions in one paragraph with no newlines). These will parse as a single step. Mitigation: acceptable for Sprint 1 — the user can still read and exit. Sprint 2's structured steps table eliminates this entirely.

**Expo Router full-screen modal on Android** → Behavior may differ from iOS. Mitigation: test on both platforms; fall back to `presentation: 'modal'` if full-screen causes issues.

**Web Wake Lock API availability** → Not available in Safari on iOS (only in Safari on macOS 14.1+). Mitigation: graceful degradation — cooking mode works fine without it, screen just may sleep. No error shown.

**Rating on completion conflicts with existing log flow** → Users can also log a rating from the recipe detail. Two entry points for the same data. Mitigation: both write to `recipe_ratings` identically; no duplication risk since each cook is a separate row.

## Migration Plan

No database migrations. No deployment steps beyond normal CI/CD.

1. Ship mobile cooking mode (modal screen + component)
2. Ship "Start Cooking" button on mobile recipe detail
3. Ship web overlay + button on web recipe detail
4. Both in the same PR — platform parity requirement

## Open Questions

None. All decisions resolved during design session.
