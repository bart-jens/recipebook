# Imported Filter Tab — Design

**Date:** 2026-02-22

## Goal

Add an "Imported" filter tab to the My Recipes screen on both mobile and web, so users can quickly find all recipes they've imported from outside EefEats.

## Approach

Add a fifth primary filter tab alongside the existing four. No new tables, no query changes, no DB migrations.

**Tab order:** All → Imported → Published → Saved → Favorited

## Filter Condition

```
source_type IN ('url', 'photo', 'instagram', 'telegram')
```

Equivalently: `source_type NOT IN ('manual', 'fork')`.

- `manual` = user-created original recipe — excluded
- `fork` = forked from another EefEats recipe — excluded (EefEats-originated content)
- Everything else = imported from outside — included

## Files Changed

- `mobile/app/(tabs)/recipes.tsx` — add 'imported' to filter tabs and client-side filter logic
- `src/app/(authenticated)/recipes/page.tsx` (or equivalent web recipes page) — same

## Out of Scope

- Favouriting cook-gate: already enforced at DB level (RLS on `recipe_favorites` requires `cook_log` entry)
- Source badges on recipe cards
- DB migrations
- Any changes to saved/favourited behaviour
