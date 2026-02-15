# EefEats — Product Features & Ideas

> Actively maintained. Claude updates this as features ship and ideas emerge.
> Last updated: 2026-02-15

---

## Current Features (Shipped)

### Web App (Next.js)
- **Manual recipe entry** — Structured form with ingredients table (quantity, unit, name, notes)
- **URL import** — Parse recipe websites via schema.org markup, strips all non-recipe content
- **Instagram import** — Extract recipes from post captions and recipe card images via Gemini 2.0 Flash
- **Photo OCR import** — Upload cookbook photo, Gemini Vision API extracts structured recipe
- **Recipe detail view** — Full recipe with ingredients, steps, metadata, hero image
- **Recipe editing** — Edit any field of existing recipes, inline tag editing
- **Recipe images** — Upload photos, auto-extract from imported URLs, image rehosting pipeline (download -> sharp resize -> WebP -> Supabase Storage)
- **Ratings & cooking log** — 1-5 star ratings with notes and cooked date
- **Search & filter** — Full-text search, tag filtering, favorites, sort by updated/alpha/rating
- **Favorites** — Mark recipes as favorites (pinned to top of list)
- **Tags** — Categorize recipes with custom tags, inline add/remove
- **Unit conversion** — Toggle between metric and imperial units
- **Home dashboard** — Personalized greeting, stats (recipes/favorites/times cooked), recently updated recipes, discover/trending section with creator names
- **Discover page** — Browse public recipes from other users
- **User profiles** — Profile editing (display name, bio, avatar upload), public profile pages
- **Privacy settings** — Profile visibility (public/private), follow request approval
- **Invite management** — Create invite codes, track usage, share codes
- **Auth** — Supabase Auth with email/password, invite-code gated signup

### Mobile App (Expo / React Native)
- **Tab navigation** — Home, Recipes, Discover, Profile tabs with custom icons
- **Recipe list** — Personal recipe collection with search, import menu (URL/Instagram/Photo)
- **Recipe detail** — Parallax hero image, animated sections, haptic feedback, ingredient list, steps, ratings
- **Recipe editing** — Edit recipes from mobile, inline tag add/remove (long-press to delete)
- **Recipe images** — Camera capture, photo library upload, image display
- **URL import** — Paste recipe URL, extract via API, review in form before saving
- **Instagram import** — Paste Instagram post URL, extract recipe via Gemini API
- **Photo OCR import** — Camera capture or library pick, AI extracts recipe from image
- **Favorites** — Toggle favorites with haptic feedback
- **Ratings** — Rate recipes, view cooking log
- **Discover tab** — Browse public recipes with sort pills (Newest/Top Rated/Most Forked), tag filter bar, fork counts
- **User profiles** — Profile editing, avatar upload, public profile pages, follower/following counts
- **Follow system** — Follow/unfollow users, follow requests for private profiles, request management
- **Invite management** — Create invites, share codes, track pending/joined status
- **Shared design system** — `theme.ts` with colors, spacing, typography, shadows, radii (no hardcoded values)
- **Animations & polish** — Lottie loading states, skeleton screens, reanimated scroll animations, haptic feedback
- **Auth** — Login/signup with invite code support

### Database / Backend
- **Social data model** — User profiles (display_name, bio, avatar_url, privacy settings), recipe visibility, forking relationships, follows
- **Follow system** — Followers/following with request-based approval for private profiles
- **Invite system** — Invite codes with per-user limits, usage tracking
- **Recipe images** — `recipe_images` table with storage paths, `image_url` on recipes for primary image
- **Image rehosting** — API route downloads external images, resizes with sharp, converts to WebP, uploads to Supabase Storage
- **Auto profile creation** — Trigger creates profile on signup
- **RLS policies** — Row-level security on all tables, scoped to auth.uid()
- **API routes for mobile** — Extract endpoints (URL, Instagram, Photo), invites endpoint — mobile calls these with Supabase auth tokens

### Seed Data
- **15 realistic test recipes** with Unsplash images, full ingredients, tags, and ratings for development/testing

---

## In Progress (Specced, Not Implemented)

### Recipe Publishing
- **Publish/unpublish flow** — Set recipe visibility to public, with confirmation
- **Discovery enhancements** — Search by title, filter by tags, sort by rating/recency/popularity
- **Creator attribution** — Show creator profile link on public recipe detail pages
- **Free vs premium limit** — Free users can publish up to 10 recipes, premium unlimited
- See `openspec/changes/recipe-publishing/`

### Social Login
- **Google OAuth** — Sign in with Google on web and mobile
- **Apple OAuth** — Sign in with Apple on web and mobile (required for App Store)
- **Invite code enforcement** — Social signups still require invite code
- **Account linking** — Email + social login auto-link on matching email
- See `openspec/changes/social-login/`

---

## Planned (Build Sequence)

### Social Platform (next up after in-progress changes)
- **Forking** — Fork a canonical recipe into a private copy, with attribution back to original
- **Activity feed** — See what friends cooked, rated, published (what friends are cooking)
- **Invite system improvements** — Invite limits by plan, tracking who invited whom, referral chain

### Kitchen Experience
- **Cooking mode** — Focused step-by-step view optimized for kitchen use (large text, screen-awake, voice?)
- **Offline caching** — Cache recipes locally for kitchen use without connectivity
- **Recipe scaling** — Adjust servings and auto-recalculate ingredient quantities

### Monetization
- **Creator system** — Creator profiles, subscribers-only recipes, creator dashboard
- **Sponsored recipes** — Brand-promoted canonical recipes (native content, not ads)
- **Premium plan** — Expanded limits, advanced features (meal planning, etc.)
- **Analytics** — Recipe view/cook/fork tracking, creator analytics dashboard

---

## Product Ideas (Backlog)

### High Conviction
- **Home screen evolution** — Make home a daily destination:
  - "What should I cook?" — Random recipe suggestion weighted toward untried/not-cooked-recently
  - "Friends are cooking" feed — Activity from people you follow (post-social launch)
  - "New from creators you follow" — Fresh recipes from followed creators
  - Quick actions row (import recipe, browse discover, random recipe)
- **Meal planning** — Weekly meal planner that pulls from your recipe collection (premium feature)
- **Shopping list** — Auto-generate grocery list from selected recipes, merge duplicate ingredients
- **Cooking mode** — Step-by-step instruction view with large text, screen-awake, timer integration
- **Collections** — Organize recipes into themed collections ("Weeknight Dinners", "Holiday Baking")

### Worth Exploring
- **Telegram bot import** — Send a recipe link or photo via Telegram, auto-imports to your collection
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
| Publishing recipes | Up to 10 | Unlimited |
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
