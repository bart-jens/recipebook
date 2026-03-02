## Context

The Supabase type generator produces `database.ts` — a full schema mirror. Components use these directly, leading to two problems:

1. **Local type duplication**: `PublicRecipe`, `EnrichedRecipe`, `RecipeTag`, etc. are defined inline in each page file. The same shape is defined 4+ times across web alone, and again differently on mobile.
2. **`as unknown as` workarounds**: Supabase query builder can't always infer nested join shapes, so files cast results with `as unknown as SomeType[]` — defeating the type system.

The `shared/lib/` directory already exists (unit-conversion.ts), establishing the cross-platform shared module pattern with relative imports.

## Goals / Non-Goals

**Goals:**
- Single canonical definition for each core domain object
- Eliminate inline local type definitions in page/screen files
- Remove `as unknown as` casts from web discover, recipes, and profile pages
- Both platforms import from the same source

**Non-Goals:**
- Replacing all database types everywhere (only the types with active duplication/casting problems)
- Runtime validation (Zod schemas) — that's a separate future concern
- Generating types automatically from DB — these are hand-maintained application types

## Decisions

**D1: Location — `shared/types/domain.ts`**
Follows the established `shared/lib/unit-conversion.ts` pattern. Both web and mobile import via relative path (`../../shared/types/domain`). Simple, no monorepo tooling needed.

**D2: Build on top of DB types, don't replace them**
Domain types extend or compose DB row types where possible. For computed/enriched shapes (e.g., `RecipeWithMetadata` which has `avgRating` computed from joined ratings), we define them as flat interfaces that match what Supabase queries actually return. This avoids fighting the type system.

**D3: Five initial types to canonicalize**
- `RecipeListItem` — used on both recipe list pages (web + mobile), includes image, times, tag count
- `RecipeWithIngredients` — detail view: recipe + ingredients array
- `UserProfile` — public profile shape (display_name, avatar_url, bio, follower counts)
- `FeedItem` — activity feed event with polymorphic payload
- `PublicRecipe` — discover page shape with creator info + aggregate rating

**D4: No barrel re-exports from platform files**
Web: `import type { RecipeListItem } from '../../../shared/types/domain'`
Mobile: `import type { RecipeListItem } from '../../shared/types/domain'`
No wrapper files — direct imports only. Fewer indirections.

## Risks / Trade-offs

[Risk] Shared types can drift from actual DB schema → Mitigation: Add a comment in domain.ts pointing to the DB tables each type maps to. When `npm run gen:types` is run, manually verify alignment.

[Risk] Supabase query builder still can't infer nested join shapes → Mitigation: Use `as` cast to the domain type (not `as unknown as`) — a single-step cast is safer and explicit about intent.

## Migration Plan

1. Create `shared/types/domain.ts`
2. Update web files: replace inline type definitions with imports, remove `as unknown as`
3. Update mobile files: same pattern
4. Verify TypeScript compiles on both platforms (`tsc --noEmit`)
