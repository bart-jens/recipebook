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
- **Search & filter** — Full-text search, tag filtering, course/meal-type filter, favorites, sort by updated/alpha/rating/prep time/cook time
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
- **Recipe interaction model** — Five distinct recipe actions with clear gates:
  - **Saved** — Your unified recipe collection. Includes your originals, imports, and public recipes you bookmark. One stack, no distinction in UI. Replaces overloaded `is_favorite`.
  - **Cooked It** — Log that you made a recipe, with date. The primary social signal ("Eef cooked Pad Thai"). Gate: recipe must be in your saved collection.
  - **Rating** — 1-5 stars + note. Gate: must have cooked the recipe at least once. Every rating = someone actually made the dish.
  - **Favorited** — "This is a go-to recipe." Badge of honor. Gate: must have cooked at least once. Separate from saved — saved = "want to try", favorited = "love it, make it often".
  - **Published** — Share your original recipe publicly. Already exists via visibility column.
- **Forking** — Fork a canonical recipe into a private copy, with attribution back to original
- **Activity feed** — See what friends cooked, rated, published (what friends are cooking). Chronological from friends, curated for discovery.
- **Invite system improvements** — Invite limits by plan, tracking who invited whom, referral chain

### Kitchen Experience
- **Cooking mode** — Focused step-by-step view optimized for kitchen use (large text, screen-awake, voice?)
- **Offline caching** — Cache recipes locally for kitchen use without connectivity
- **~~Recipe scaling~~** — Shipped: servings adjuster with +/- buttons, scales all ingredient quantities

### Monetization
- **Creator system** — Creator profiles, subscribers-only recipes, creator dashboard
- **Sponsored recipes** — Brand-promoted canonical recipes (native content, not ads)
- **Premium plan** — Expanded limits, advanced features (meal planning, etc.)
- **Analytics** — Recipe view/cook/fork tracking, creator analytics dashboard
- **Emergent creator tiers** (later) — Users auto-unlock creator status based on thresholds (published originals + engagement + followers). No application process. Tiers: Home Cook → Contributor → Creator.
- **Verified creators** (later) — Platform-reviewed creators vouched for recipe quality and originality. Boosted in Discover, eligible for sponsored content. "Verified" = quality, not just identity.

---

## Product Ideas (Backlog)

### High Conviction
- **Home screen evolution** — Make home a daily destination:
  - "What should I cook?" — Random recipe suggestion weighted toward untried/not-cooked-recently
  - "Friends are cooking" feed — Activity from people you follow (post-social launch)
  - "New from creators you follow" — Fresh recipes from followed creators
  - Quick actions row (import recipe, browse discover, random recipe)
- **Meal planning** — Weekly meal planner that pulls from your recipe collection (premium feature)
- **Shopping list / Grocery list** — "Add to grocery list" button on recipe detail, auto-generate from selected recipes, merge duplicate ingredients across multiple recipes, check-off UI for in-store shopping
- **Cooking mode** — Step-by-step instruction view with large text, screen-awake, timer integration
- **Collections** — Organize recipes into themed collections ("Weeknight Dinners", "Holiday Baking")
- **Groups** — Shared spaces for cooking together. MVP: shared recipe collections (curated lists where any member can add recipes). Later: group activity feed ("I'm making this tonight"), group meal planning, shared grocery lists. Natural free/premium split: free for small groups (2-3, e.g. household), premium for larger groups (cooking clubs, friend circles).

### Worth Exploring
- **Wine & drink pairing** — Pair wines/drinks with dinners, capture bottle label photo, drink recommendations per recipe
- **Telegram bot import** — Send a recipe link or photo via Telegram, auto-imports to your collection
- **Nutritional info** — Estimate calories/macros from ingredients (API integration)
- **Seasonal suggestions** — Surface recipes based on seasonal ingredients
- **Cooking streaks** — Gamification: track cooking frequency, encourage regular cooking
- **Recipe notes/variations** — Add personal notes to any recipe ("I used less salt", "double the garlic")
- **Print-friendly view** — Clean recipe layout optimized for printing
- **Share to friends** — Direct recipe sharing within the platform (not just public publishing)
- **Voice control** — Hands-free navigation during cooking ("next step", "read ingredients")
- **Cooking techniques library** — Explainer cards for cooking techniques (braising, making a roux, julienne, etc.) linked from recipe steps and ingredients. Platform-curated for quality. Could become creator content (verified creators write technique guides). Free: basic technique cards. Premium: detailed guides with video content.

### Content Integrity & Plagiarism Protection
- **Report button** — "Copied content" option on public recipes, community-driven flagging
- **Similarity detection on publish** — Compare new "original" recipes against the author's own imports and other public recipes on the platform. Flag suspiciously close matches before publishing.
- **"Verified Original" badge** — Recipes that pass similarity checks earn a trust badge, boosted in Discover (premium/earned feature)
- **Creator dispute flow** — Creator A claims Creator B copied their recipe → platform compares timestamps + similarity → earlier publisher gets presumption → disputed recipe hidden pending resolution
- **Import-to-publish paper trail** — If someone imports a recipe then publishes a suspiciously similar "original", the import history provides evidence
- **Creator protection (premium)** — Priority dispute resolution, proactive monitoring of copies of your published content
- **Cookbook publisher partnerships** — Publishers claim their catalog on EefEats (like Spotify for labels), making unauthorized copies detectable. Revenue share on traffic driven to their books.
- **ToS enforcement** — Clear terms: publishing someone else's recipe as your own = violation. Repeat offenders lose publishing privileges.
- **Phased rollout:** (1) Report button + ToS at invite scale, (2) same-user similarity checks pre-open-signups, (3) cross-user detection + badges + dispute flow at scale

### Long-term Vision
- **Recipe AI assistant** — Ingredient-based search ("What can I make with chicken, rice, and broccoli?"), craving-based search ("something warm and comforting"), occasion-based queries ("quick weeknight dinner for 4"), search across your own collection first then public recipes
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
| Groups | Small (2-3 members) | Larger groups |
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
