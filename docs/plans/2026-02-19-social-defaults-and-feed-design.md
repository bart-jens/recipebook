# Social Defaults & Feed Alive

**Date:** 2026-02-19
**Status:** Approved

## Problem

The social loop (cook -> share -> discover -> follow -> cook) has all the pieces built, but they're passive and disconnected. Recipes default to private, sharing requires explicit action, and the mobile app has no activity feed. The app feels like a private notebook instead of a social platform.

## Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Original recipe visibility | Public by default | Social platform — if you wrote it, share it |
| Imported recipes | Auto-recommend to followers | Share metadata card, no copyrighted content |
| Free tier publish limit | Remove during invite-only | Reintroduce limits when opening signups |
| User awareness | Subtle badge (lock icon for private) | Public is the norm, only exceptions are marked |

## Design

### 1. Visibility Defaults

- New manual recipes default to `visibility: 'public'` with `published_at` auto-set on insert.
- The "Publish" button is removed. Replaced by a **Public/Private toggle** on recipe detail — simple switch, no modal.
- Imported recipes remain private (existing CHECK constraint `imported_recipes_stay_private`). Their social presence is through auto-recommendation cards only.
- Existing private manual recipes stay private. No retroactive changes.
- Drop the `enforce_publish_limit` trigger.

### 2. Auto-Recommend on Import

- Importing a recipe (URL, Instagram, photo) auto-creates a `recipe_shares` entry.
- Generates a "saved" event in followers' activity feeds.
- Recommendation card shows: title, source domain, cover image, tags, rating. No copyrighted content (instructions, description).
- "View source" link drives traffic to original creator's site.
- User can remove the recommendation from recipe detail page.
- No modal, no prompt — it just happens.

### 3. Enriched Activity Feed Events

| Event | Trigger | What followers see |
|---|---|---|
| `created` | User creates a manual recipe (auto-public) | Recipe card: image, title, tags. "View recipe" link |
| `saved` | User imports a recipe | Recommendation card: title, source, image. "View source" link |
| `cooked` | User logs cooking | Recipe name, cook notes |
| `rated` | User rates a recipe | Recipe name, star rating, notes |

The old `published` and `shared` event types are replaced by `created` and `saved`.

Feed cards are richer: avatar + name, recipe image thumbnail, contextual CTA, relative timestamp.

### 4. Home Tab Redesign (Mobile + Web)

The Home tab becomes a social hub with personal utility. Sections top to bottom:

**Section A: Activity Feed**
- Latest activity from people you follow.
- Rich cards for each event type.
- Infinite scroll or "Show more".
- Empty state: "Follow some chefs to see what they're cooking" -> links to Discover.

**Section B: "Looking for something to cook?"**
- Horizontal scrollable row of your favorites (starred recipes).
- Falls back to recently saved/imported if no favorites yet.
- Quick access to go-to recipes.

**Section C: Your Recent Activity**
- What you recently cooked, saved, or created.
- Compact list (2-3 items), "See all" links to My Recipes.

### 5. Public/Private Toggle UX

**Recipe detail page (web + mobile):**
- Simple toggle near the top: Public / Private.
- Manual recipes: defaults to Public. Flip to Private anytime.
- Imported recipes: locked to Private. Shows "Recommended to followers" note with option to remove.

**Recipe cards (in lists):**
- Lock icon for private recipes. No icon for public (public is the norm).

### 6. Database Changes

| Change | Detail |
|---|---|
| Default visibility | `'private'` -> `'public'` for manual recipes, auto-set `published_at` |
| Auto-share on import | Insert into `recipe_shares` on recipe import |
| Drop publish limit | Remove `enforce_publish_limit` trigger |
| New feed events | Add `created`, `saved`, `rated` to `activity_feed_view` |
| Replace old events | `published` -> `created`, `shared` -> `saved` |

## Scope

- Both web (Next.js) and mobile (React Native/Expo) platforms.
- Database migration for defaults + feed view changes.
- Home tab redesign on both platforms.
- Public/Private toggle replaces Publish button on both platforms.

## Out of Scope (Future)

- "Followers-only" visibility tier.
- Activity timeline on profile pages.
- Push notifications for activity.
- "What's cooking" digests.
- Forking / recipe customization.
