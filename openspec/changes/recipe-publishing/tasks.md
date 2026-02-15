## 1. Database: Schema Changes

- [ ] 1.1 Create migration: add `visibility` (text NOT NULL default 'private', CHECK in private/public/subscribers), `published_at` (timestamptz nullable), and `forked_from_id` (uuid nullable FK to recipes ON DELETE SET NULL) columns to `recipes` table
- [ ] 1.2 Add partial index on `recipes(visibility)` WHERE visibility = 'public' for discovery queries
- [ ] 1.3 Add partial index on `recipes(published_at)` WHERE visibility = 'public' for sort-by-newest

## 2. Database: RLS Policies

- [ ] 2.1 Update `recipes` SELECT policy: owner can read their own recipes (any visibility) + any authenticated user can read recipes with visibility = 'public'
- [ ] 2.2 Update `recipes` UPDATE policy: only owner can update (auth.uid() = created_by)
- [ ] 2.3 Add publish limit enforcement: create a BEFORE UPDATE trigger that rejects visibility change to 'public' if user is on free plan and already has 10 public recipes

## 3. Database: Ratings for Public Recipes

- [ ] 3.1 Update `recipe_ratings` INSERT policy: allow any authenticated user to rate a public recipe (not just recipe owner)
- [ ] 3.2 Update `recipe_ratings` SELECT policy: ratings on public recipes visible to all authenticated users

## 4. Web: Discovery Page

- [ ] 4.1 Create discovery page at `/discover` with layout: search bar, tag filter pills, sort dropdown (Newest/Highest Rated/Most Popular), and recipe card grid
- [ ] 4.2 Implement discovery query: fetch public recipes with creator profile (join user_profiles), aggregate rating (left join recipe_ratings), filtered by search term and tags, sorted by selected option, paginated (20 per page)
- [ ] 4.3 Implement infinite scroll / load-more pagination on discovery page
- [ ] 4.4 Add empty state for no results: "No recipes found. Try a different search or check back later."

## 5. Web: Recipe Card Component

- [ ] 5.1 Create reusable RecipeCard component showing: recipe image (or placeholder), title, creator name + avatar (linked to profile), aggregate rating (stars + count), up to 3 tags, cook time
- [ ] 5.2 Handle edge cases: no image (placeholder), no ratings ("No ratings yet"), no tags (hide tag area), no cook time (hide)

## 6. Web: Publish / Unpublish Flow

- [ ] 6.1 Add "Publish" button on own private recipe detail page. On click, show confirmation dialog. On confirm, update visibility to 'public' and published_at to now().
- [ ] 6.2 Add "Published" badge and "Unpublish" button on own public recipe detail page. On click, show confirmation dialog. On confirm, update visibility to 'private' and published_at to null.
- [ ] 6.3 Add publish limit indicator for free users: show "X/10 published" near publish button. Disable button at limit with "Upgrade to Premium for unlimited publishing" message.

## 7. Web: Creator Attribution

- [ ] 7.1 Add creator display name + avatar to recipe detail page for public recipes. Link creator name to their profile page (`/profile/[userId]`).
- [ ] 7.2 Add aggregate rating display (average stars + count) to recipe detail page header for public recipes with ratings from multiple users.

## 8. Mobile: Discover Tab

- [ ] 8.1 Replace Discover tab placeholder with discovery screen: search bar, tag filter, sort picker, recipe list
- [ ] 8.2 Create mobile RecipeCard component with same data as web (image, title, creator, rating, tags, cook time)
- [ ] 8.3 Implement discovery query with same logic as web (public recipes, search, filter, sort, pagination)
- [ ] 8.4 Add pull-to-refresh and infinite scroll pagination

## 9. Mobile: Publish / Unpublish

- [ ] 9.1 Add "Publish" action to recipe detail screen for own private recipes. Confirmation alert, then update visibility.
- [ ] 9.2 Add "Published" badge and "Unpublish" action to own public recipe detail screen.
- [ ] 9.3 Add publish limit indicator for free users on mobile.

## 10. Mobile: Creator Attribution

- [ ] 10.1 Add creator name + avatar to public recipe detail screen, tappable to navigate to creator's profile.
- [ ] 10.2 Add aggregate rating display on public recipe detail screen.
