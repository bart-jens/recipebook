# EefEats — Product Features & Ideas

> Actively maintained. Claude updates this as features ship and ideas emerge.
> Last updated: 2026-02-14

---

## Current Features (Shipped)

### Web App (Next.js)
- **Manual recipe entry** — Structured form with ingredients table (quantity, unit, name, notes)
- **URL import** — Parse recipe websites via schema.org markup, strips all non-recipe content
- **Instagram import** — Extract recipes from post captions and recipe card images
- **Photo OCR import** — Upload cookbook photo, Gemini Vision API extracts structured recipe
- **Recipe detail view** — Full recipe with ingredients, steps, metadata
- **Recipe editing** — Edit any field of existing recipes
- **Ratings & cooking log** — 1-5 star ratings with notes and cooked date
- **Search & filter** — Full-text search, tag filtering, favorites, sorting
- **Favorites** — Mark recipes as favorites for quick access
- **Tags** — Categorize recipes with custom tags
- **Auth** — Supabase Auth with email/password, invite-code gated signup

### Mobile App (Expo)
- **Tab navigation** — Home, Recipes, Discover, Profile tabs
- **Recipe list** — Personal recipe collection with search
- **Recipe detail** — Full recipe view with ingredients and steps
- **Recipe editing** — Edit recipes from mobile
- **Favorites** — Toggle favorites
- **Ratings** — Rate recipes, view cooking log
- **Discover tab** — Browse public recipes
- **Profile** — User profile screen
- **Auth** — Login/signup with invite code support

### Database / Backend
- **Social data model** — User profiles, recipe visibility, forking relationships, follows
- **Invite system** — Invite codes for controlled signups
- **Auto profile creation** — Trigger creates profile on signup
- **RLS policies** — Row-level security on all tables

---

## In Progress

- **Instagram import (mobile)** — Bringing URL/Instagram import to mobile app
- **Design system** — Shared `theme.ts` for mobile, standardizing all screens

---

## Planned (Build Sequence)

### Social Platform (next up)
- **User profiles** — Profile editing, public profile pages, display name, avatar, bio
- **Recipe publishing** — Publish personal recipes as canonical public recipes
- **Discovery page** — Browse, search, and filter public canonical recipes
- **Forking** — Fork a canonical recipe into a private copy, with attribution back to original
- **Social graph** — Follow/unfollow users, activity feed (what friends cooked/rated)
- **Invite system improvements** — Invite limits by plan, tracking who invited whom

### Mobile Feature Parity
- **Recipe import (mobile)** — Camera capture, photo library, URL paste, Instagram
- **Cooking mode** — Focused step-by-step view optimized for kitchen use (large text, voice?)
- **Offline caching** — Cache recipes locally for kitchen use without connectivity
- **Animations & polish** — Smooth transitions, haptic feedback, gesture navigation

### Monetization
- **Creator system** — Creator profiles, subscribers-only recipes, creator dashboard
- **Sponsored recipes** — Brand-promoted canonical recipes (native content, not ads)
- **Premium plan** — Expanded limits, advanced features (meal planning, etc.)
- **Analytics** — Recipe view/cook/fork tracking, creator analytics dashboard

---

## Product Ideas (Backlog)

### High Conviction
- **Home screen refresh** — Make home a daily destination, not a static dashboard:
  - Quick actions row (import recipe, browse discover, random recipe) — actionable entry points
  - "What should I cook?" — Random recipe suggestion weighted toward untried/not-cooked-recently
  - "Friends are cooking" feed — Activity from people you follow (post-social launch)
  - "New from creators you follow" — Fresh recipes from followed creators
  - Trending section — Most cooked this week, highest rated new recipes
- **Meal planning** — Weekly meal planner that pulls from your recipe collection (premium feature)
- **Shopping list** — Auto-generate grocery list from selected recipes, merge duplicate ingredients
- **Cooking mode** — Step-by-step instruction view with large text, screen-awake, timer integration
- **Collections** — Organize recipes into themed collections ("Weeknight Dinners", "Holiday Baking")

### Worth Exploring
- **Telegram bot import** — Send a recipe link or photo via Telegram, auto-imports to your collection
- **Recipe scaling** — Adjust servings and auto-recalculate ingredient quantities
- **Nutritional info** — Estimate calories/macros from ingredients (API integration)
- **Seasonal suggestions** — Surface recipes based on seasonal ingredients
- **Cooking streaks** — Gamification: track cooking frequency, encourage regular cooking
- **Recipe notes/variations** — Add personal notes to any recipe ("I used less salt", "double the garlic")
- **Print-friendly view** — Clean recipe layout optimized for printing
- **Share to friends** — Direct recipe sharing within the platform (not just public publishing)
- **Voice control** — Hands-free navigation during cooking ("next step", "read ingredients")

### Long-term Vision
- **Recipe AI assistant** — "What can I make with chicken, rice, and broccoli?"
- **Ingredient substitution** — AI-powered suggestions for ingredient swaps (dietary, availability)
- **Community challenges** — Weekly cooking challenges with a specific ingredient or theme
- **Restaurant-to-recipe** — Recreate restaurant dishes: describe what you ate, get a recipe attempt
- **Multi-language recipes** — Translation support for international recipe sharing
- **Video recipes** — Short cooking videos attached to recipes (creator feature)

---

## Free vs Premium Split (Guiding Principles)

| Feature | Free | Premium |
|---------|------|---------|
| Personal recipes | Unlimited | Unlimited |
| Recipe imports | Limited/month | Unlimited |
| Public recipe browsing | Yes | Yes |
| Forking public recipes | Yes | Yes |
| Following users | Yes | Yes |
| Meal planning | No | Yes |
| Advanced shopping lists | No | Yes |
| Nutritional info | No | Yes |
| Cooking analytics | Basic | Detailed |
| Collections | Limited count | Unlimited |
| Offline caching | Limited | Full library |
| Creator features | Apply to become creator | -- |
| Subscribers-only recipes | Subscribe to creators | -- |

---

## Design Principles

1. **Kitchen-first** — Every feature should work with messy hands on a phone
2. **Recipe purity** — Strip all content-farm garbage. Only the recipe matters.
3. **Your collection, your way** — Personal forks let you customize any recipe without losing the original
4. **Social without noise** — Follow friends, see what they cook, no algorithmic feed manipulation
5. **Creators earn** — Real attribution, real subscriptions, no race to the bottom
