# Mobile App (React Native / Expo)

EefEats mobile app — the daily driver for cooking, discovering, and sharing recipes. Built with React Native and Expo, targeting iOS and Android from a single codebase. Connects to the same Supabase backend as the web app.

## Architecture

### Stack
- **Framework:** React Native with Expo (managed workflow)
- **Navigation:** Expo Router (file-based, mirrors Next.js mental model)
- **State:** React Query (TanStack Query) for server state, React context for local
- **Backend:** Existing Supabase instance (shared with web app)
- **Auth:** Supabase Auth via `@supabase/supabase-js` (magic link + Google sign-in)
- **Storage:** Supabase Storage for recipe images
- **Push notifications:** Expo Notifications (for social activity — future)

### Relationship to Web App
The mobile app and web app are separate codebases sharing the same Supabase backend. No shared UI code. Shared data model via the same database. The web app remains the better experience for recipe editing (large forms, copy-paste). The mobile app is optimized for browsing, cooking, and social interaction.

### Project Structure
A new repository or a monorepo with the web app. Decision deferred — start as a separate repo, merge later if sharing code becomes valuable.

---

## ADDED Requirements

### Requirement: Tab-based navigation
The mobile app SHALL use a bottom tab bar with tabs: Home (feed), Discover, My Recipes, Profile. The tab bar SHALL be visible on all primary screens.

#### Scenario: Navigating between tabs
- **WHEN** a user taps the "Discover" tab
- **THEN** the discovery screen SHALL be shown with the tab highlighted

#### Scenario: Deep navigation preserves tab state
- **WHEN** a user navigates from Discover → recipe detail → back
- **THEN** the Discover tab SHALL return to its previous scroll position

### Requirement: Home / Activity Feed tab
The Home tab SHALL show the user's activity feed: recent actions by followed users (published, cooked, forked). Each entry shows: user avatar + name, action description, recipe title with thumbnail, timestamp. Tapping an entry navigates to the recipe detail.

#### Scenario: Empty feed (new user)
- **WHEN** a new user opens the Home tab with no follows
- **THEN** a friendly prompt SHALL suggest discovering recipes or following friends

#### Scenario: Feed pagination
- **WHEN** the user scrolls to the bottom of the feed
- **THEN** older entries SHALL be loaded automatically (infinite scroll)

### Requirement: Discover tab
The Discover tab SHALL show a search bar and a grid/list of public canonical recipes. Default sort: trending (most cooked in the last 7 days). Supports search by title, filter by tags, sort by: trending, highest rated, newest, most forked.

#### Scenario: Searching in discover
- **WHEN** a user types "chicken" in the search bar
- **THEN** public recipes matching "chicken" SHALL be shown in real-time

#### Scenario: Tag filtering
- **WHEN** a user taps a tag pill (e.g., "Italian")
- **THEN** only recipes with that tag SHALL be shown

### Requirement: My Recipes tab
The My Recipes tab SHALL show the user's personal recipe collection: their own recipes (private and public) and their forks. Search, sort, and filter identical to the current web app (search, tags, sort by updated/alpha/rating). Favorites pinned to top.

#### Scenario: Viewing personal collection
- **WHEN** a user opens My Recipes
- **THEN** all their recipes (private, public, forks) SHALL be shown
- **AND** forks SHALL show a small "forked from" label

### Requirement: Recipe detail screen
The recipe detail screen SHALL show: title, creator attribution, tags, description, time/servings info, ingredients (with unit toggle), instructions (numbered steps), cooking log, and action buttons (favorite, fork, rate, share).

#### Scenario: Cooking mode
- **WHEN** a user taps "Start cooking"
- **THEN** the screen SHALL switch to a simplified view with large text, step-by-step navigation, and screen-awake lock

#### Scenario: Forking from detail
- **WHEN** a user taps "Save to my recipes" on someone else's public recipe
- **THEN** a private fork SHALL be created and the user navigated to their copy

### Requirement: Profile tab
The Profile tab SHALL show: avatar, display name, bio, stats (recipes published, times cooked, followers/following), and a grid of their public recipes. Other users' profiles are viewable via tapping their name anywhere in the app.

#### Scenario: Viewing own profile
- **WHEN** a user opens the Profile tab
- **THEN** their profile SHALL be shown with an "Edit profile" button

#### Scenario: Viewing another user's profile
- **WHEN** a user taps on a recipe creator's name
- **THEN** that creator's public profile SHALL be shown with a Follow/Unfollow button

### Requirement: Camera integration for recipe import
The app SHALL support importing recipes via the device camera: take a photo of a recipe card, cookbook page, or handwritten recipe. Uses the same Gemini Vision extraction pipeline as the web app. Also supports picking from photo library.

#### Scenario: Camera capture
- **WHEN** a user taps "Import from photo" and takes a photo
- **THEN** the photo SHALL be sent for extraction and the review screen shown

#### Scenario: Photo library import
- **WHEN** a user taps "Import from photo" and selects from library
- **THEN** the selected image SHALL be processed identically to a camera capture

### Requirement: Offline-capable recipe viewing
Recipes the user has recently viewed or explicitly saved SHALL be available offline. The app SHALL cache recipe data locally and show a subtle indicator when offline. Writes (ratings, new recipes) SHALL be queued and synced when connectivity returns.

#### Scenario: Viewing a cached recipe offline
- **WHEN** the device loses connectivity and the user opens a previously viewed recipe
- **THEN** the recipe SHALL be displayed from cache with an "offline" indicator

#### Scenario: Rating while offline
- **WHEN** the user rates a recipe while offline
- **THEN** the rating SHALL be saved locally and synced when online

### Requirement: Push notifications (future)
The app SHALL support push notifications for: someone followed you, someone cooked your recipe, new recipe from someone you follow. Notifications are opt-in per type. Implemented via Expo Notifications + Supabase Edge Functions.

*This is a future requirement — not in v1.*

---

## Build Sequence (Mobile App)

1. **Project setup** — Expo init, Supabase client, auth flow (magic link + Google), tab navigation skeleton
2. **My Recipes tab** — personal recipe list, recipe detail screen, existing functionality parity with web
3. **Recipe import** — camera capture, photo library, URL import, Instagram import (reuse extraction APIs)
4. **Discover tab** — public recipe browsing, search, tag filtering
5. **Social** — profiles, follow/unfollow, forking, activity feed
6. **Polish** — cooking mode, offline caching, animations, haptics

---

## Free vs Premium Considerations

| Feature | Free | Premium |
|---|---|---|
| My Recipes tab | Full access | Full access |
| Discover | Full access | Full access |
| Camera import | 5 per month | Unlimited |
| Cooking mode | Yes | Yes |
| Offline caching | Last 10 recipes | Unlimited |
| Push notifications | Basic (follows) | All types |
| Activity feed | Yes | Yes |
