## Why

Users have personal recipes but no way to share them publicly. Recipe publishing lets users turn personal recipes into canonical public recipes, visible to everyone on the discovery page. This is the core social action that makes EefEats a platform, not just a personal cookbook. Combined with user profiles (previous change), publishing establishes creator attribution and feeds the discovery experience.

## What Changes

- **Recipe visibility column** — Extend `recipes` table with `visibility` (private/public/subscribers), `published_at` (timestamptz), and `forked_from_id` (uuid, for future forking)
- **Publish flow** — UI to publish a personal recipe (set visibility to public), with confirmation
- **Unpublish flow** — UI to revert a public recipe back to private
- **Discovery page** — Browse, search, and filter public canonical recipes. Search by title, filter by tags, sort by rating/recency/popularity
- **Recipe cards** — Display aggregate ratings, creator name, tags on discovery cards
- **Creator attribution** — Show creator profile link on public recipe detail pages
- **RLS updates** — Public recipes readable by anyone, writable only by owner
- **Free vs Premium limit** — Free users can publish up to 10 recipes, premium unlimited

## Capabilities

### New Capabilities
- `recipe-publishing`: Publish/unpublish flow, discovery page, recipe cards with aggregate ratings, creator attribution, free/premium publish limits

### Modified Capabilities
- `social-platform`: Add visibility/published_at/forked_from_id columns to recipes table, update recipe RLS for public visibility
- `recipe-crud`: Recipe detail page must show creator attribution and aggregate ratings for public recipes

## Impact

**Database:**
- Alter `recipes` table: add `visibility` (text, default 'private'), `published_at` (timestamptz), `forked_from_id` (uuid nullable FK)
- Update RLS policies on `recipes` for public read access
- Add indexes for discovery queries (visibility, published_at, tags)

**Frontend (Web):**
- Discovery page at `/discover` with search, tag filter, sort controls
- Recipe card component for discovery grid
- Publish/unpublish button on recipe detail page
- Creator name link on public recipe detail
- Publish limit indicator for free users

**Frontend (Mobile):**
- Discover tab content (currently placeholder) with search, filter, sort
- Recipe card component for discovery list
- Publish action on recipe detail screen
- Creator attribution on public recipe detail

**Free vs Premium:**
- Free: publish up to 10 recipes
- Premium: unlimited publishing
