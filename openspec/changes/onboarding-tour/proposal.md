## Why

New users signing up via an invite link currently land in the app with zero guidance after profile setup. The feed is empty, the recipes tab is blank, and there's no signal about what to do. For a product you're actively sending to friends, the first 60 seconds must earn their trust. A premium first-launch experience is essential before wide distribution.

## What Changes

- **Onboarding carousel**: 3 slides shown exactly once after `onboarding.tsx` saves the profile. Slides cover the core value props (recipe book, import methods, social feed). Last slide has a "Get started" CTA. Swipeable, skippable. Seen-state stored in AsyncStorage so it never repeats.
- **Recipes tab empty state**: Shown when user has no recipes. Large visual, clear headline, three action buttons (Import from URL, Scan a photo, Add manually).
- **Feed/home tab empty state**: Shown when user has no feed activity. Headline, subtitle, two CTAs (Add a recipe, Discover recipes).
- **Invite screen error state**: When `fetchInviteToken` fails, show inline error text + retry link below the disabled copy-link button instead of silently graying it out.

## Capabilities

### New Capabilities

- `onboarding-tour`: First-launch carousel and empty state system for new users

### Modified Capabilities

*(none — all changes are additive)*

## Impact

- **Mobile only** — all changes are in `mobile/`
- Files touched: `mobile/app/onboarding.tsx` (trigger carousel after save), new `mobile/app/tour.tsx` (carousel screen), `mobile/app/(tabs)/recipes.tsx` (empty state), `mobile/app/(tabs)/index.tsx` (feed empty state), `mobile/app/invites.tsx` (error state)
- New dependency: none — uses existing `expo-router`, AsyncStorage (already installed), and theme system
