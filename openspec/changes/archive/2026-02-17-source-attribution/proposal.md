## Why

Photo-imported recipes (cookbook pages) currently have an optional, easily-skipped source attribution field. Users aren't nudged to cite the cookbook, and if they skip it the data is lost forever — `source_name` can't be edited after creation. This is a missed opportunity for IP defensibility, data richness (cookbook popularity insights, future affiliate links), and the foundation of a "cookbook shelf" social feature. Additionally, the `/api/extract-book-cover` endpoint lacks authentication.

## What Changes

- **Redesign photo import source step**: Replace the bare optional text field with a structured source attribution flow — source type categories (cookbook, family recipe, friend, other), prominent book cover scanner, and explicit "Skip for now" instead of silent empty.
- **Add `source_name` to recipe edit form**: Allow editing source attribution after creation on both web and mobile.
- **Fix book cover API auth**: Add authentication check to `/api/extract-book-cover` endpoint, consistent with other extract routes.

## Capabilities

### New Capabilities
_(none — all changes enhance existing capabilities)_

### Modified Capabilities
- `recipe-crud`: Recipe edit form gains `source_name` field; recipe detail shows editable source attribution for owned recipes.

## Impact

- **Web**: `src/app/(authenticated)/recipes/import-photo/page.tsx` (source attribution redesign), `src/app/(authenticated)/recipes/components/recipe-form.tsx` (add source_name field), `src/app/api/extract-book-cover/route.ts` (add auth)
- **Mobile**: `mobile/app/recipe/import-photo.tsx` (source attribution redesign), recipe edit form (add source_name field)
- **No database changes** — `source_name` column already exists, no new columns needed
- **No breaking changes** — existing recipes with null `source_name` continue to work fine
