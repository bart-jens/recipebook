## 1. Database: Recipe Schema Changes

- [x] 1.1 Create migration: add `visibility` (text NOT NULL default 'private', CHECK in private/public/subscribers), `published_at` (timestamptz nullable), `forked_from_id` (uuid nullable FK to recipes ON DELETE SET NULL), and `source_name` (text nullable) columns to `recipes` table
- [x] 1.2 Add CHECK constraint: `source_type = 'manual' OR visibility = 'private'` (imported recipes cannot be published)
- [x] 1.3 Add partial indexes: `recipes(visibility) WHERE visibility = 'public'`, `recipes(published_at) WHERE visibility = 'public'`
- [x] 1.4 Backfill `source_name` on existing imported recipes by extracting domain from `source_url`
- [x] 1.5 Add `image_type` column (text, NOT NULL, default 'source', CHECK in: 'source', 'user_upload') to `recipe_images`; backfill existing rows to 'source'

## 2. Database: Recipe Shares & Views

- [x] 2.1 Create `recipe_shares` table (id, user_id, recipe_id, notes, shared_at) with unique constraint on (user_id, recipe_id)
- [x] 2.2 Enable RLS on `recipe_shares`: owner + followers can read, only owner can insert/delete own shares
- [x] 2.3 Create `recipe_share_cards` view joining recipe_shares with safe recipe metadata (title, source_url, source_name, source_type, image_url, tags, user rating)
- [x] 2.4 Add indexes on recipe_shares (user_id, shared_at) for feed queries

## 3. Database: RLS & Limits

- [x] 3.1 Add RLS policy: any authenticated user can read recipes with visibility = 'public'
- [x] 3.2 Add RLS policy: recipe_ratings INSERT allowed for any authenticated user on public recipes
- [x] 3.3 Add RLS policy: recipe_ratings SELECT allowed for all on public recipes
- [x] 3.4 Add BEFORE UPDATE trigger: reject visibility change to 'public' if free user already has 10 public recipes
- [x] 3.5 Enforce free/premium photo limits (3 for free, 10 for premium) at API level
- [x] 3.6 Update TypeScript types (`database.ts`) to include new columns: visibility, published_at, forked_from_id, source_name, image_type

## 4. Source Name Extraction

- [x] 4.1 Create domain-to-name mapping utility (seriouseats.com -> "Serious Eats", bonappetit.com -> "Bon Appetit", etc.) with raw domain fallback
- [x] 4.2 Update URL import (`recipe-parser.ts`) to extract and return `source_name` from URL domain
- [x] 4.3 Update Instagram import to set `source_name` from Instagram handle when available, fallback to "Instagram"
- [x] 4.4 Update recipe save actions (web + mobile) to persist `source_name` to database

## 5. Source Attribution & Image Type

- [x] 5.1 Web: add source attribution line ("from Serious Eats") below title on recipe detail page, linked when source_url present
- [x] 5.2 Mobile: add source attribution line below title on recipe detail screen, linked when source_url present
- [x] 5.3 Update URL import image rehosting to set `image_type: 'source'`
- [x] 5.4 Update user image upload flows to set `image_type: 'user_upload'`
- [x] 5.5 Update `recipes.image_url` logic to prefer first user-uploaded photo as hero image

## 6. Photo Import Source Prompt

- [x] 6.1 Web: add "Source" input field on photo import review screen with placeholder "e.g. The Food Lab, Ottolenghi Simple"
- [x] 6.2 Mobile: add "Source" input field on photo import review screen with placeholder text
- [x] 6.3 Mobile: add "Scan book cover" button that captures photo and extracts title via Gemini Vision
- [x] 6.4 Wire source_name from photo import form to recipe save action

## 7. Discovery Page

- [x] 7.1 Web: create discovery page at `/discover` with layout: search bar, tag filter pills, sort dropdown (Newest/Highest Rated/Most Popular), and recipe card grid
- [x] 7.2 Web: implement discovery query: fetch public recipes with creator profile, aggregate rating, filter by search/tags, sort, paginated (20 per page)
- [x] 7.3 Web: implement infinite scroll / load-more pagination
- [x] 7.4 Web: add empty state: "No recipes found. Try a different search or check back later."
- [x] 7.5 Mobile: replace Discover tab placeholder with discovery screen: search bar, tag filter, sort picker, recipe list
- [x] 7.6 Mobile: implement discovery query with same logic as web
- [x] 7.7 Mobile: add pull-to-refresh and infinite scroll pagination

## 8. Recipe Card Component

- [x] 8.1 Web: create reusable RecipeCard component: recipe image (or placeholder), title, creator name + avatar (linked), aggregate rating (stars + count), up to 3 tags, cook time
- [x] 8.2 Web: handle edge cases: no image, no ratings, no tags, no cook time
- [x] 8.3 Mobile: create RecipeCard component with same data as web
- [x] 8.4 Mobile: handle edge cases matching web

## 9. Publish / Unpublish Flow (Original Recipes)

- [x] 9.1 Web: add "Publish" button on own private original recipe detail page with confirmation dialog
- [x] 9.2 Web: add "Published" badge and "Unpublish" button on own public recipe detail with confirmation
- [x] 9.3 Web: add publish limit indicator for free users: "X/10 published", disabled at limit with upgrade message
- [x] 9.4 Mobile: add "Publish" action to recipe detail screen for own private original recipes with confirmation alert
- [x] 9.5 Mobile: add "Published" badge and "Unpublish" action on own public recipe detail
- [x] 9.6 Mobile: add publish limit indicator for free users

## 10. Creator Attribution on Public Recipes

- [x] 10.1 Web: add creator display name + avatar on recipe detail page for public recipes, linked to profile
- [x] 10.2 Web: add aggregate rating display (average stars + count) on public recipe detail
- [x] 10.3 Mobile: add creator name + avatar on public recipe detail screen, tappable to profile
- [x] 10.4 Mobile: add aggregate rating display on public recipe detail

## 11. Share Flow (Imported Recipes)

- [x] 11.1 Web: add share/unshare button on imported recipe detail page (replaces publish button)
- [x] 11.2 Web: build share modal with "Any changes you made?" notes textarea
- [x] 11.3 Web: create server action to insert/delete recipe_shares
- [x] 11.4 Mobile: add share/unshare button on imported recipe detail screen
- [x] 11.5 Mobile: build share bottom sheet with notes input
- [x] 11.6 Mobile: wire share action to Supabase recipe_shares table

## 12. Recommendation Cards & Feed

- [x] 12.1 Web: build recommendation card component (title, source attribution, rating, notes, thumbnail, actions)
- [x] 12.2 Web: display recommendation cards on user profile page
- [x] 12.3 Web: display recommendation cards in social feed
- [x] 12.4 Mobile: build recommendation card component matching web design
- [x] 12.5 Mobile: display recommendation cards on profile screen
- [x] 12.6 Mobile: display recommendation cards in feed tab

## 13. Save to My Recipes

- [x] 13.1 Web: add "Save to my recipes" action on recommendation cards
- [x] 13.2 Web: implement save flow — re-import from source URL if reachable, copy metadata if dead/missing
- [x] 13.3 Web: show appropriate messaging when source URL is dead or absent
- [x] 13.4 Mobile: add "Save to my recipes" action on recommendation cards
- [x] 13.5 Mobile: implement save flow matching web behavior

## 14. Photo Carousel

- [x] 14.1 Web: build photo carousel component ordering user_upload photos before source thumbnails
- [x] 14.2 Mobile: build photo carousel component ordering user_upload photos before source thumbnails
