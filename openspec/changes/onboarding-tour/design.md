## Context

The profile setup screen (`onboarding.tsx`) already exists and works — users set display name, username, and avatar. The gap is everything after: new users land in the main tabs with no context, no content, and no clear first action. This change adds a premium welcome moment and smart empty states.

## Goals / Non-Goals

**Goals:**
- One-time carousel shown immediately after first profile save — elegant, skippable
- Premium empty states on recipes and feed tabs that drive first meaningful action
- Inline error + retry on invite screen when token fetch fails
- All visuals consistent with the existing warm cream + brown palette

**Non-Goals:**
- Interactive product tours / tooltips overlaying live UI
- Onboarding analytics / progress tracking
- Web parity (mobile-only change)
- Forced walkthroughs that block app usage

## Decisions

### Carousel as a separate screen, not a modal

The carousel lives at `/tour` — a full-screen route the user is navigated to after `onboarding.tsx` saves. After completing or skipping, it navigates to `/(tabs)`. This keeps the onboarding flow linear and avoids z-index/modal complexity.

**Alternative considered:** Modal overlay on top of tabs. Rejected: adds complexity, feels less intentional, harder to animate well.

### Seen-state stored in AsyncStorage

A single boolean key `eefeats:tour_seen` prevents the carousel from ever showing again. Checked in `(tabs)/_layout.tsx` before the onboarding redirect chain — if tour not seen, redirect to `/tour` instead of `/(tabs)` after onboarding completes.

**Simpler alternative:** Just redirect from `onboarding.tsx` directly to `/tour`. This is what we'll do — no layout change needed. `onboarding.tsx` routes to `/tour` on success; `/tour` routes to `/(tabs)` when done.

### Rich empty states — not the generic EmptyState component

The existing `EmptyState` component supports one action button. The recipes empty state needs three distinct actions (URL import, photo scan, add manually), and the feed needs two styled CTAs. We'll build inline empty state JSX directly in each tab rather than extending the generic component, keeping it focused.

### Carousel visuals: abstract geometric shapes, not illustrations

The app has no illustration library. Using the existing `LogoMark` (fork dot SVG) scaled large + simple geometric accent shapes keeps the carousel visually rich without needing new assets. Warm cream background, ink typography, brown accent — consistent with app identity.

## Risks / Trade-offs

- **AsyncStorage read on cold start**: The tour check in `onboarding.tsx` is a fast local read (< 5ms). No meaningful delay.
- **Carousel skip = same outcome**: Whether user taps Skip or Get Started, they land in `/(tabs)`. No divergent state.
- **Empty states disappear when content arrives**: The recipes tab already checks `allRecipes.length === 0` in the FlatList logic — we just need to render the rich empty state in that branch. Feed similarly.
