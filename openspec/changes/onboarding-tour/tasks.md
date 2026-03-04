## 1. Tour Screen (Carousel)

- [x] 1.1 Create `mobile/app/tour.tsx` — full-screen carousel with 3 slides (Welcome, Import, Social). Swipeable via FlatList with `pagingEnabled`. Dot indicators. Skip button top-right. "Get started" on last slide. On exit (skip or finish): write `eefeats:tour_seen=true` to AsyncStorage then `router.replace('/(tabs)')`.
- [x] 1.2 Slide visuals: Slide 1 — large `LogoMark` (size 80) centered on warm accent wash circle. Slide 2 — stacked abstract rectangles suggesting recipe cards (drawn with View/border, no images). Slide 3 — two overlapping avatar circles (initials-style). All use theme colors only, no external assets.
- [x] 1.3 Wire carousel into onboarding flow: in `mobile/app/onboarding.tsx`, after successful profile save, check AsyncStorage for `eefeats:tour_seen`; if not set, `router.replace('/tour')`, else `router.replace('/(tabs)')`.

## 2. Recipes Tab Empty State

- [x] 2.1 In `mobile/app/(tabs)/recipes.tsx`, replace the existing generic `<EmptyState>` render (when `allRecipes.length === 0` and not loading) with a rich inline empty state: large fork icon, headline "Your recipe book is empty", subtitle, and three action rows (Import from a website → `/recipe/import-url`, Scan a cookbook photo → `/recipe/import-photo`, Add manually → `/recipe/new`). Each action row has an icon, label, and chevron.
- [x] 2.2 Style to feel premium: generous vertical padding, warm `accentWash` background with `accentWashBorder`, action rows separated by hairline borders, labels in `typography.label`, chevron in `colors.inkMuted`. No emojis.

## 3. Feed Tab Empty State

- [x] 3.1 In `mobile/app/(tabs)/index.tsx`, detect when feed data has loaded but both `data.feed` and `data.suggestions` are empty (or absent). Render a centered empty state: large fork dot visual, headline "Nothing here yet", subtitle "Add your first recipe or follow friends to see what they're cooking.", primary button "Add a recipe" (navigates to recipes tab), secondary text-style button "Discover recipes" (navigates to discover tab).
- [x] 3.2 Style consistently with recipes empty state: same accentWash treatment, primary button uses `colors.ink` background + white text (full width), secondary button is plain text in `colors.accent`.

## 4. Invite Screen Error State

- [x] 4.1 In `mobile/app/invites.tsx`, add `inviteTokenError` boolean state. In `fetchInviteToken`, catch errors and set `inviteTokenError = true` on failure; clear it on success.
- [x] 4.2 Below the "Copy invite link" button, conditionally render: `<Text style={styles.errorText}>Couldn't load your invite link.</Text>` + inline `<TouchableOpacity onPress={fetchInviteToken}><Text style={styles.retryText}>Retry</Text></TouchableOpacity>` when `inviteTokenError` is true and `inviteToken` is null.
