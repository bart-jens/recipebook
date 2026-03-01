# EefEats — Product Features & Ideas

> Actively maintained. Claude updates this as features ship and ideas emerge.
> Last updated: 2026-02-28
> Last audit: 2026-02-28 — see audit findings integrated throughout.

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
- **Search & filter** — Full-text search, tag filtering, course/meal-type filter, favorites, sort by updated/alpha/rating/prep time/cook time
- **Favorites** — Mark recipes as favorites (pinned to top of list)
- **Tags** — Categorize recipes with custom tags, inline add/remove
- **Unit conversion** — Toggle between metric and imperial units
- **Collections** — Organize recipes into themed collections
- **Home — social hub** — Activity feed (created/saved/cooked/rated events from followed chefs), "Looking for something to cook?" favorites row, "Your Recent Activity" cook log
- **Discover page** — Browse public recipes from other users
- **User profiles** — Profile editing (display name, bio, avatar upload), public profile pages
- **Privacy settings** — Profile visibility (public/private), follow request approval
- **Invite management** — Create invite codes, track usage, share codes
- **Auth** — Supabase Auth with email/password, invite-code gated signup

### Mobile App (Expo / React Native)
- **Tab navigation** — Home, Discover, My Recipes, Grocery, Profile tabs with custom icons
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

### Social Defaults & Feed (Shipped 2026-02-20)
- **Public by default** — Manual recipes are public when created, no publish button needed
- **Auto-recommend imports** — Imported recipes automatically create recommendation cards for followers (non-copyrightable metadata only)
- **Public/Private toggle** — Simple toggle on recipe detail replaces the old publish modal
- **Enriched activity feed** — 4 event types: created, saved, cooked, rated. Saved events link to source. Rated events show stars.
- **Home redesigned as social hub** — Activity feed (primary), "Looking for something to cook?" favorites row, "Your Recent Activity" cook log
- **Publish limit removed** — During invite-only phase, no cap on published recipes

### Database / Backend
- **Social data model** — User profiles (display_name, bio, avatar_url, privacy settings), recipe visibility, forking relationships, follows
- **Follow system** — Followers/following with request-based approval for private profiles
- **Invite system** — Invite codes with per-user limits, usage tracking
- **Recipe images** — `recipe_images` table with storage paths, `image_url` on recipes for primary image
- **Image rehosting** — API route downloads external images, resizes with sharp, converts to WebP, uploads to Supabase Storage
- **Auto profile creation** — Trigger creates profile on signup
- **RLS policies** — Row-level security on all tables, scoped to auth.uid()
- **API routes for mobile** — Extract endpoints (URL, Instagram, Photo), invites endpoint — mobile calls these with Supabase auth tokens
- **Shopping list** — `shopping_lists`, `shopping_list_items` tables, add-to-list RPC

---

## In Progress (Specced, Not Implemented)

### Social Login (code ready, needs provider config)
- **Google OAuth** — Sign in with Google on web and mobile
- **Apple OAuth** — Sign in with Apple on web and mobile (required for App Store)
- **Invite code enforcement** — Social signups still require invite code
- **Account linking** — Email + social login auto-link on matching email
- **Status:** Backend code, auth context, callback route, and DB trigger all implemented. UI buttons hidden until OAuth providers are configured in Supabase Dashboard.
- **TODO:** Configure Google Cloud Console OAuth credentials + Apple Developer Services ID, add to Supabase Auth providers, then re-enable buttons on login screens.
- See `openspec/changes/archive/2026-02-17-social-login/`

---

## Roadmap

> Sequenced by the 2026-02-28 audit. Priorities set by: (1) churn risk, (2) monetization unlock, (3) retention loop.

---

### Sprint 0 — Engineering Foundation *(ship before Sprint 1)*

> These are not features. They are the structural changes that prevent us from building on a cracked foundation. The 2026-02-28 audit found one critical security issue, two production bugs, and workflow gaps that guarantee we'll keep shipping the same classes of mistake. Fix this first.
>
> Full change: `openspec/changes/2026-02-28-engineering-foundation/`

**[CRITICAL — SECURITY] Fix `user_follows` RLS policy**
Current policy uses `using (true)` — any unauthenticated request can enumerate the full social graph. Add a migration that scopes selects to `auth.uid()` relationships and public profile counts only.
- Blocks: open signups, any growth push
- Effort: 20 min
- *Do this before any other task this sprint.*

**[PROCESS] Wire Supabase type generation into build**
Run `supabase gen types typescript --linked` on every pre-push. Add `npm run gen:types` to `package.json`. Eliminates the `as unknown as SomeType[]` pattern that currently bypasses the type system in 9 files.
- Effort: 15 min

**[PROCESS] Embed 5 workflow rules in CLAUDE.md**
The five rules from the 2026-02-28 audit — platform scope, RLS auditor gate, error states required, query signature in prompts, test-before-fix — must live in `.claude/CLAUDE.md` so they are active every session.
- Effort: 5 min

**[PROCESS] Add rls-auditor gate to pre-push hook**
`scripts/check-migration-audit.sh` blocks push when new SQL migration files are detected, unless `SKIP_RLS_CHECK=1` is set. Forces auditor run before any migration ships.
- Effort: 10 min

**[BUG] Fix activity feed `loadMore` error state + hasMore off-by-one**
Two bugs in production: (1) if RPC throws, `loading` state is never reset — button disabled forever; (2) `hasMore = newItems.length === 20` shows a spinner for an empty last page. Add `finally` block + error state UI.
- Effort: 25 min

**[REFACTOR] Extract `formatTime`/`formatTimeAgo` to shared lib**
Function is duplicated identically in 6+ files across both platforms. A single behavior change requires 6 edits. Extract to `src/lib/format.ts` + `mobile/lib/format.ts`.
- Effort: 30 min

**[DESIGN] Fix `fontWeight: '500'` in import screens**
`mobile/app/recipe/import-photo.tsx:415` uses medium weight — a hard violation of the Inter Tight typography system (only 300 Light + 400 Regular allowed). Replace with `typography.label` token.
- Effort: 10 min

**[UX POLISH] Recipe image fade-in on web home carousel**
Images pop in abruptly. A blur-to-clear CSS reveal (`filter: blur(8px) → blur(0)` on `onLoad`) makes loading feel intentional. Requires extracting the recipe card to a `"use client"` component.
- Effort: 20 min

**[PARITY] Add web EmptyState component**
Mobile has a shared `EmptyState` with icon, title, subtitle, and action. Web uses inline divs with repeated patterns. Extract to `src/components/ui/empty-state.tsx`, replace inline empty states on home and discover.
- Effort: 15 min

---

### Sprint 1 — Stop the Bleeding

> Biggest churn risks and a broken UX. Ship before any growth work.

**Cooking Mode** *(mobile first, web later)*
The single feature that separates a kitchen app from a recipe website. Full-screen, screen-awake, one step at a time. Large text, minimal UI, no distractions. No timer yet.
- Blocks: Paprika-switchers, kitchen usability
- Scope: Step-by-step view, screen-awake lock, prev/next navigation, progress indicator

**Fix Grocery Tab**
The Grocery tab is visible to every user on every session and is functionally incomplete. A broken tab is a broken promise.
- Scope: Complete the shopping list UI (add items from recipe, check-off in-store, clear checked)

**Import Rate Limiting (Free Tier Gate)**
Extract API routes have no rate limiting. Add `monthly_imports_used` counter to `user_profiles`, checked in each `/api/extract-*` route.
- Free: 20 imports/month. Premium: unlimited.
- This is the clearest free→paid trigger — heavy importers are the most engaged users.

**Deduplicate Unit Conversion**
`src/lib/unit-conversion.ts` and `mobile/lib/unit-conversion.ts` are identical. One bug fix will miss one platform. Move to `shared/lib/unit-conversion.ts`, import on both.

---

### Sprint 2 — Close the Kitchen Gap

> Features Paprika users expect. Required to retain power users.

**Offline Recipe Caching** *(mobile)*
Cache "My Recipes" locally so the app works in a kitchen with bad WiFi. Requires TanStack Query first (see below).
- Free: last 20 recipes cached. Premium: full library. — natural premium hook.

**Add TanStack Query to Mobile**
Currently all data fetching is manual `useEffect + useState`. No caching, no deduplication, no stale-while-revalidate. Every navigation re-fetches everything.
- Required foundation for offline caching and perceived performance improvements.

**Ingredient Text Search**
Search your own recipe collection by ingredient. "I have chicken and lemons — what can I make?" No AI needed: full-text search on `recipe_ingredients`.
- High user value, low engineering effort. Extends to public recipes in Discover.

**Domain Type Layer**
All types come from the auto-generated `database.ts`. No application-layer types.
- Create `shared/types/domain.ts` with `Recipe`, `UserProfile`, `FeedItem`, `RecipeWithMetadata`, etc.
- Before the codebase grows further, this prevents silent type drift between platforms.

**Cooking Mode Timer Integration**
Per-step timers inside cooking mode. "Simmer for 10 minutes" → tap to start a countdown, notification when done.
- Completes the cooking mode experience after sprint 1 ships the basics.

---

### Sprint 3 — Build the Retention Loop

> The feature set that keeps users opening the app weekly, not just when they remember a recipe.

**Meal Planning** *(premium)*
Weekly calendar view. Drag recipes onto days. The primary premium feature — tangible daily utility.
- Blocks the grocery list pipeline below.

**Smart Grocery List**
"Add all ingredients from this week's meal plan to my grocery list." Merges duplicate ingredients across recipes (`3 cups flour` + `1 cup flour` = `4 cups flour`). Check-off UI for in-store use.
- Whisk's strongest retention driver. The meal plan → grocery list pipeline is the loop that brings users back weekly.
- Free: manual add per recipe. Premium: auto-generate from meal plan + merge duplicates.

**Premium Upgrade Modal + Paywall**
Currently there is no upgrade UI anywhere. Required before any monetization works.
- A single `<UpgradeModal>` component, triggered when a free user hits any limit. Used everywhere.
- Design principle: paywall is a feature showcase, not a dead end. Show what they're unlocking.

**Recipe Analytics for Creators**
`recipe_analytics` table exists, no writes happen yet. Creators need to see views/cooks/forks to feel the value of publishing. Required before creator subscriptions have perceived value.
- Scope: write analytics events, build a simple creator dashboard (views, cooks, forks per recipe, follower growth).

**Recipe Interaction Model Refinement**
Five distinct actions with clear gates (from product spec):
- **Saved** — Unified collection. Your originals, imports, bookmarked public recipes. Replaces overloaded `is_favorite`.
- **Cooked It** — Log it. Primary social signal. Gate: must be saved.
- **Rating** — 1-5 + note. Gate: must have cooked at least once. Every rating = someone actually made the dish.
- **Favorited** — "This is a go-to." Gate: cooked at least once. Separate from saved.
- **Published** — Already exists via visibility column.

**Forking**
Fork a canonical recipe into a private, editable copy. Attribution back to original always displayed.
- DB schema supports `forked_from_id` already. Needs UI: fork button → private copy → "forked from [creator]" attribution on detail.

---

### Sprint 4 — Monetization Live

> Payment layer and creator system. Only build this after sprint 3 establishes the retention loop.

**Stripe Integration + Creator Subscriptions**
Tables exist (`creator_subscriptions`, `creator_profiles`). Needs:
- Stripe Connect for creator payouts
- Subscription management UI (subscribe, cancel, manage)
- Subscribers-only recipe gate on detail view (single RLS policy check — plumbing exists)
- Platform takes 15%

**Social Login (Google + Apple)**
Code is written. Only needs Supabase provider config (Google Cloud Console OAuth credentials + Apple Developer Services ID). Unlock before open signups.

**Invite System Improvements**
- Invite limits enforced by plan (free: 3, premium: unlimited)
- Track who invited whom (referral chain — useful for creator attribution and abuse detection)

**Sponsored Recipes**
Brand-promoted canonical recipes. Native content, not ads.
- `sponsored` and `sponsor_metadata` columns already in planned schema.
- Scope: admin tooling to mark recipes as sponsored, placement logic in Discover, disclosure label.

**Creator Tiers (Emergent)**
Users auto-unlock creator status based on thresholds (published originals + engagement + followers). No application process.
- Tiers: Home Cook → Contributor → Creator
- Verified creators: platform-reviewed, boosted in Discover, eligible for sponsored content.

---

## Restaurant Dishes — Product Idea

> **Framing note:** The strongest version of this is NOT a Yelp competitor. It's restaurants as a recipe inspiration source — the missing link between eating out and cooking at home.

### The idea
You eat something amazing at a restaurant. You log it on EefEats — the dish, the restaurant, your notes. Later, you try to recreate it. EefEats becomes the place where that experience turns into a recipe.

**Core loop:**
`Eat at restaurant → log dish → attempt recreation → publish recipe → "inspired by [dish] at [restaurant]"`

### What this is
- **Dish log** — Log dishes you've eaten at restaurants, with photos, notes, and a rating
- **Restaurant as a field on dish logs** — Name, maybe location (not a full Yelp clone — just enough context)
- **"Recreate this dish"** — One tap to start a new recipe pre-filled with the dish name and "inspired by" attribution
- **"Restaurant inspiration" source type** — Recipes can have `source_type: 'restaurant'` alongside `url`, `instagram`, `photo`, `manual`
- **Activity feed events** — "Bart tried Cacio e Pepe at Tonino's" → "Bart published a recreation"
- **Discovery angle** — Browse recreations of famous dishes from well-known restaurants

### What this is NOT
- A restaurant review platform (Yelp/Google Maps already lost that war)
- Star ratings for restaurants (not the value prop)
- Restaurant discovery or booking

### Why this fits EefEats specifically
- Extends the "Goodreads for recipes" metaphor: just as Goodreads tracks books you've read AND books you want to read, EefEats tracks recipes you've made AND dishes you've experienced and want to recreate
- Unique to EefEats — no other recipe app owns this "restaurant → recreation" workflow
- Natural premium hook: restaurant dish log is free, AI-assisted recreation suggestions are premium
- Drives original recipe creation (the most valuable content on the platform)

### Already on the roadmap
"Restaurant-to-recipe" was already listed as a long-term vision item. This gives it a concrete product shape.

### What to build (MVP)
1. `dish_logs` table: `user_id`, `dish_name`, `restaurant_name`, `restaurant_location`, `notes`, `photo`, `eaten_at`, `linked_recipe_id`
2. "Log a dish" flow on mobile (most natural — you're at the restaurant)
3. "Recreate" button that pre-fills a new recipe
4. Activity feed event: `dish_logged`
5. `source_type: 'restaurant'` on recipes for attribution display

### Deferred
- Structured restaurant data (Foursquare/Google Places API integration for autocomplete) — useful but not required for MVP
- Community dish logs for the same restaurant (e.g., "12 people have tried to recreate the Tonino's cacio e pepe") — powerful but complex, save for v2

---

## Product Ideas Backlog

### High Conviction
- **"What should I cook?" home screen** — Daily destination: random suggestion weighted toward untried/not-cooked-recently, friends are cooking feed, new from creators you follow, quick actions row
- **Cooking streaks** — Gamification: track cooking frequency. "You've cooked 4 days in a row." Encourages regular use.
- **Groups** — Shared recipe collections. MVP: household (2-3 members, free). Premium: cooking clubs, friend circles. Shared grocery list for a group meal.
- **Collections limit enforcement** — Free: 5 collections. Premium: unlimited. (Tables exist, enforcement not built.)
- **Print-friendly view** — Clean recipe layout for printing. Underrated utility feature.

### Worth Exploring
- **Nutritional info** — Estimate calories/macros from ingredients (API integration). Premium feature.
- **Wine & drink pairing** — Pair wines/drinks with dinners. Capture bottle label photo. Premium.
- **Telegram bot import** — Send a recipe link or photo via Telegram, auto-imports to collection.
- **Seasonal suggestions** — Surface recipes based on seasonal ingredients in your region.
- **Recipe notes/variations** — Personal notes on any recipe ("I used less salt", "double the garlic") without forking. Lightweight.
- **Share to friends** — Direct recipe sharing within the platform (not just public publishing). Like a DM for recipes.
- **Voice control** — Hands-free navigation in cooking mode ("next step", "read ingredients"). Natural cooking mode extension.
- **Cooking techniques library** — Explainer cards for techniques (braising, julienne, etc.) linked from recipe steps. Curated by platform, later extensible to verified creators. Free: basic. Premium: detailed guides.

### Content Integrity & Plagiarism Protection
- **Report button** — "Copied content" flag on public recipes. Phase 1 at invite scale.
- **Similarity detection on publish** — Compare new "original" recipes against the author's own imports and other public recipes. Flag suspicious matches before publishing.
- **"Verified Original" badge** — Recipes that pass similarity checks earn a trust badge, boosted in Discover.
- **Creator dispute flow** — Creator A claims Creator B copied → platform compares timestamps + similarity → earlier publisher gets presumption → disputed recipe hidden pending resolution.
- **Import-to-publish paper trail** — Import history as evidence if someone publishes a suspiciously similar "original."
- **Creator protection (premium)** — Priority dispute resolution, proactive monitoring of copies of your content.
- **Cookbook publisher partnerships** — Publishers claim their catalog (like Spotify for labels). Revenue share on traffic. Makes unauthorized copies detectable.
- **Phased rollout:** (1) Report button + ToS at invite scale, (2) same-user similarity checks pre-open-signups, (3) cross-user detection + badges + dispute flow at scale.

### Long-term Vision
- **Recipe AI assistant** — Ingredient-based search with AI ("something warm and comforting for 4"), search across own collection first then public
- **Ingredient substitution** — AI-powered swaps for dietary restrictions or missing items
- **Community challenges** — Weekly cooking challenges with a specific ingredient or theme
- **Multi-language recipes** — Store original language, display badge. AI translation as premium feature. See `openspec/changes/recipe-language-translation/`
- **Video recipes** — Short cooking videos attached to recipes (creator feature)
- **Cookbook publisher partnerships** — See Content Integrity above

---

## Free vs Premium Split

| Feature | Free | Premium |
|---------|------|---------|
| Personal recipes | Unlimited | Unlimited |
| Recipe imports | 20/month | Unlimited |
| Public recipe browsing | Yes | Yes |
| Forking public recipes | Yes | Yes |
| Publishing recipes | Unlimited (invite-only phase) | Unlimited |
| Following users | Yes | Yes |
| Collections | 5 | Unlimited |
| Offline caching | Last 20 recipes | Full library |
| Meal planning | No | Yes |
| Smart grocery list (auto-generate + merge) | Manual add per recipe | Auto from meal plan |
| Nutritional info | No | Yes |
| Cooking analytics | Basic | Detailed |
| Groups | Small (2-3 members) | Larger groups |
| Auto-translation | No | Yes |
| Restaurant dish log | Yes | Yes |
| AI recreation suggestions (dish → recipe) | No | Yes |
| Creator features | Earn via thresholds | — |
| Subscribers-only recipes | Subscribe to creators | — |
| Creator protection (dispute priority) | Standard | Priority |

---

## Design Principles

1. **Kitchen-first** — Every feature should work with messy hands on a phone
2. **Recipe purity** — Strip all content-farm garbage. Only the recipe matters.
3. **Your collection, your way** — Personal forks let you customize any recipe without losing the original
4. **Social without noise** — Follow friends, see what they cook, no algorithmic feed manipulation
5. **Creators earn** — Real attribution, real subscriptions, no race to the bottom
6. **Eat → cook loop** — The platform should close the loop between eating inspiration (restaurants, social) and cooking action
