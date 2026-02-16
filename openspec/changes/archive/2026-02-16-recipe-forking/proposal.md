## Why

Forking is the "make any recipe yours" value prop. When a user discovers a great public recipe but wants to tweak it — different protein, less salt, their own spin — they fork it into their collection as a private copy. The fork links back to the original for creator attribution. Fork counts also signal recipe quality on the discover page. The DB column `forked_from_id` already exists on recipes but the forking flow isn't built yet.

## What Changes

- **Fork action on public recipe detail** — "Fork this recipe" button on public recipes creates a private copy in the user's collection with `forked_from_id` set to the original.
- **Fork attribution display** — Forked recipes show "Forked from [original title] by [creator]" with a link to the original.
- **Fork count on recipe cards** — Public recipe cards show fork count as a quality signal.
- **Fork as owned recipe** — Once forked, the recipe is fully editable and appears in the user's collection as their own recipe.
- **Fork analytics** — Log fork events in `recipe_analytics` for creator dashboards.

## Capabilities

### New Capabilities
- `recipe-forking`: The fork flow, attribution display, fork counts, and fork-specific behavior.

### Modified Capabilities
- `recipe-crud`: Recipe detail page shows fork attribution. Recipe list includes forked recipes.
- `social-platform`: Fork events appear in activity feed. Fork count visible on recipe cards in discover.

## Impact

- **Database**: No new tables needed — `forked_from_id` already exists. Add fork count view/function. Insert into `recipe_analytics` on fork.
- **Web app**: Recipe detail gets fork button + attribution. Recipe cards get fork count.
- **Mobile app**: Same as web — fork button, attribution, fork count.
- **API**: Fork endpoint that duplicates recipe + ingredients + tags + images with `forked_from_id` reference.
