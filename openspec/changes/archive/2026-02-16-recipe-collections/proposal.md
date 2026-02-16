## Why

As users accumulate recipes (originals, imports, saved public recipes, forks), they need a way to organize them beyond search and tags. Collections are themed groups of recipes — "Weeknight Dinners," "Holiday Baking," "Date Night." They also become a prerequisite for Groups (shared collections) later. Collections are a natural free/premium wedge: free users get a limited number, premium users get unlimited.

## What Changes

- **Collections CRUD** — Create, rename, delete collections. Each collection has a name, optional description, and optional cover image.
- **Add/remove recipes to collections** — Any recipe in the user's collection (owned or saved) can be added to one or more collections.
- **Collection view** — Dedicated page/screen showing all recipes in a collection.
- **Collections list** — Browse all your collections from the recipe list page / tab.
- **Free tier limit** — Free users can create up to 5 collections. Premium users get unlimited.

## Capabilities

### New Capabilities
- `recipe-collections`: Collections data model, CRUD, membership, UI on web and mobile, free/premium limits.

### Modified Capabilities
- `recipe-crud`: Recipe detail page shows which collections a recipe belongs to, with add/remove option.

## Impact

- **Database**: New `collections` table, `collection_recipes` junction table. RLS policies scoped to owner.
- **Web app**: Collections section on recipe list page, collection detail page, add-to-collection action on recipe detail.
- **Mobile app**: Collections section in recipes tab, collection detail screen, add-to-collection action.
- **Free/premium**: Client-side enforcement of 5-collection limit for free users with upgrade prompt.
