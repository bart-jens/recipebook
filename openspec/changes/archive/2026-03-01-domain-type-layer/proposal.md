## Why

All application types are sourced directly from the auto-generated `database.ts` (Supabase type generator output). This means UI components, API handlers, and mobile screens all work with raw DB row shapes — no application-layer semantics. As the codebase grows across two platforms (Next.js + React Native), type drift between platforms is silent: one platform can add a field to its local type and the other never knows. Several files already use `as unknown as SomeType[]` workarounds that indicate the generated types don't match what the app actually needs.

## What Changes

- Create `shared/types/domain.ts` with application-layer types that sit on top of the generated DB types
- Types cover the 5 core domain objects: `Recipe`, `RecipeWithIngredients`, `UserProfile`, `FeedItem`, `RecipeWithMetadata`
- Both web (`src/`) and mobile (`mobile/`) import from `shared/types/domain.ts` via relative path
- Replace `as unknown as` workarounds in web discover page, recipes page, and profile page with proper typed shapes
- No DB migrations, no API changes

## Capabilities

### New Capabilities
- `domain-types`: Application-level TypeScript types for core domain objects, shared across web and mobile

### Modified Capabilities
<!-- None — no spec-level behavior changes, implementation detail only -->

## Impact

- **New file**: `shared/types/domain.ts`
- **Web files updated**: `src/app/(authenticated)/discover/page.tsx`, `src/app/(authenticated)/discover/chefs-tab.tsx`, `src/app/(authenticated)/recipes/page.tsx`, `src/app/(authenticated)/profile/[id]/page.tsx`
- **Mobile files updated**: `mobile/app/(tabs)/index.tsx`, `mobile/app/(tabs)/recipes.tsx`
- **No DB changes, no API changes, no migrations**
- **Dependency**: `shared/lib/` directory already exists (unit-conversion.ts), so the pattern is established
