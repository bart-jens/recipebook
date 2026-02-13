## Why

The foundation is in place (auth, database, deployment) but there's no way to actually use the app yet. Users need to be able to create, view, edit, and delete recipes manually. This is the core feature that everything else builds on — URL import, photo OCR, and Instagram import all produce recipes that end up in the same list and detail views built here.

## What Changes

- Add a recipe list page showing all recipes for the authenticated user
- Add a recipe creation form with structured fields (title, description, instructions, prep/cook time, servings)
- Add an ingredients table editor within the recipe form (quantity, unit, name, notes — reorderable)
- Add a recipe detail page showing all recipe data
- Add recipe editing (same form as creation, pre-filled)
- Add recipe deletion with confirmation
- All operations use Supabase with existing RLS policies

## Capabilities

### New Capabilities
- `recipe-crud`: Create, read, update, and delete recipes with structured ingredient management
- `recipe-form`: Recipe entry form with ingredient table editor, validation, and mobile-friendly inputs

### Modified Capabilities
<!-- None -->

## Impact

- New pages: `/recipes` (list), `/recipes/new` (create), `/recipes/[id]` (detail), `/recipes/[id]/edit` (edit)
- Uses existing database schema and RLS policies — no migrations needed
- All subsequent import features (URL, photo, Instagram) will reuse the recipe detail and list views
