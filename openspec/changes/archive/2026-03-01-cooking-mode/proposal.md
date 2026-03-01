## Why

EefEats is used in the kitchen, but the recipe detail screen is a reading view — not a cooking view. There is no way to follow a recipe step-by-step, hands-free, with the screen staying awake. This is the single feature that separates a kitchen app from a recipe website, and its absence is the primary reason Paprika users don't switch.

## What Changes

- Add a "Start Cooking" button on the recipe detail screen (mobile + web)
- New full-screen cooking mode: one step at a time, large text, minimal UI, screen kept awake
- Steps/Ingredients tab toggle always accessible during cooking
- Step navigation via Prev/Next buttons (44pt tap targets) — no gesture-only navigation
- Progress indicator showing current step position
- Completion flow: soft prompt to log a rating when the last step is done
- Runtime step parsing from the existing `instructions` text field — no schema change
- Screen keep-awake: `expo-keep-awake` on mobile, Web Wake Lock API on web

## Capabilities

### New Capabilities
- `cooking-mode`: Full-screen, screen-awake, step-by-step recipe walkthrough on mobile (primary) and web (sketch). Includes step parsing, navigation, ingredient reference toggle, and completion/rating prompt.

### Modified Capabilities
- `recipe-interactions`: Completion flow adds a soft rating prompt at the end of cooking — same data model as existing ratings, new entry point.

## Impact

- **Mobile**: New modal screen `mobile/app/recipe/[id]/cooking.tsx`, new component `mobile/components/ui/CookingMode.tsx`. Adds `expo-keep-awake` dependency.
- **Web**: New overlay component `src/components/ui/CookingModeOverlay.tsx`. "Start Cooking" button added to recipe detail client component.
- **Database**: No new tables or migrations. Completion uses existing `recipe_ratings` insert.
- **Data flow**: Steps parsed from `recipes.instructions` at runtime. Ingredients read from `recipe_ingredients`. Rating written to `recipe_ratings` on cook completion.
