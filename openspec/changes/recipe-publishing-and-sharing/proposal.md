## Why

Users have personal recipes but no way to share them. This change adds two distinct sharing paths:

1. **Original recipes** (created on EefEats) can be **published** as public canonical recipes, visible to everyone on the discovery page. This is the core social action that makes EefEats a platform.

2. **Imported recipes** (from URLs, Instagram, photos) can be **shared as recommendation cards** — showing the recipe title, source attribution, user's rating, and personal notes ("changes I made"). This lets users recommend recipes they found and loved without republishing copyrighted content.

This distinction protects creator IP: imported recipe instructions and images stay private, while the social layer is built on the user's original commentary, ratings, and photos.

## What Changes

- **Recipe visibility columns** — Add `visibility` (private/public/subscribers), `published_at`, `forked_from_id` to recipes table
- **Publish flow** — UI to publish original recipes (set visibility to public), with confirmation. Unpublish flow to revert.
- **Publishing restriction for imports** — Database CHECK constraint prevents imported recipes from being set to public/subscribers. They use the share flow instead.
- **Discovery page** — Browse, search, and filter public canonical recipes. Search by title, filter by tags, sort by rating/recency/popularity.
- **Recipe cards** — Display aggregate ratings, creator name, tags on discovery cards.
- **Creator attribution** — Show creator profile link on public recipe detail pages.
- **Free vs premium publish limit** — Free users can publish up to 10 recipes, premium unlimited.
- **Recipe shares table** — New table for imported recipe sharing: stores user's notes about changes they made. Creates recommendation cards visible to followers.
- **Source attribution** — Add `source_name` to recipes (e.g. "Serious Eats", "The Food Lab"). Auto-extracted from domain for URL imports, prompted for photo/book imports.
- **User recipe photos** — Users can upload "I cooked this" photos. User photos get priority over source thumbnails in a carousel display.
- **Recommendation cards** — Social cards showing title, source, rating, notes, user photos. Actions: "View source" and "Save to my recipes".
- **Save to my recipes** — Friends can save a recommended recipe to their own collection via re-import from source URL.

## Capabilities

### New Capabilities
- `recipe-publishing`: Publish/unpublish flow, discovery page, recipe cards, creator attribution, free/premium publish limits
- `recipe-sharing`: Recommendation cards for imported recipes — share flow, social card display, "save to my recipes", user photos with carousel, source attribution

### Modified Capabilities
- `social-platform`: Add visibility/published_at/forked_from_id columns; publishing restriction for imported recipes; RLS for public visibility
- `recipe-images`: User-uploaded "I cooked this" photos with priority over source thumbnails; carousel display; image_type column
- `recipe-crud`: Source attribution on detail page; publish action for originals vs share action for imports; source name prompt on photo imports
- `url-import`: Extract and store source_name from URL domain
- `instagram-import`: Store source_name from Instagram handle

## Impact

**Database:**
- Alter `recipes`: add `visibility`, `published_at`, `forked_from_id`, `source_name`
- Add CHECK constraint: imported recipes cannot have visibility != 'private'
- New table: `recipe_shares` with RLS
- Create `recipe_share_cards` view
- Alter `recipe_images`: add `image_type`
- Update RLS policies for public recipe access and ratings
- Add publish limit enforcement
- Indexes for discovery and social feed queries

**Frontend (Web):**
- Discovery page at `/discover` with search, tag filter, sort
- Recipe card component for discovery grid
- Publish/unpublish button on original recipe detail
- Share/unshare flow for imported recipes with notes prompt
- Recommendation card component for social feed
- "Save to my recipes" action
- Source attribution display
- Photo carousel
- Publish limit indicator for free users

**Frontend (Mobile):**
- Discover tab content with search, filter, sort
- Recipe card component for discovery list
- Publish action for original recipes
- Share flow for imported recipes
- Recommendation card in feed
- Source name prompt for photo/book imports + book cover scan
- Photo carousel with user photo priority

**Free vs Premium:**
- Free: publish up to 10 original recipes, share imported recipes unlimited, upload 3 photos per recipe
- Premium: unlimited publishing, unlimited sharing, 10 photos per recipe
