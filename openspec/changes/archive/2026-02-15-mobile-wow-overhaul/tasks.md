# Tasks: Mobile Visual Overhaul

**Prerequisite:** `add-recipe-images` must be completed first.

## 1. Dependencies & Setup

- [x] 1.1 Install `react-native-reanimated` v3 — add Babel plugin to `babel.config.js`, verify setup with a test animation
- [x] 1.2 Install `expo-haptics`
- [x] 1.3 Install `lottie-react-native`
- [x] 1.4 Install `expo-linear-gradient`
- [x] 1.5 Install serif font package (e.g., `@expo-google-fonts/playfair-display`) or add Playfair Display .ttf files to `mobile/assets/fonts/`
- [x] 1.6 Load the serif font in `mobile/app/_layout.tsx` alongside the existing FontAwesome and SpaceMono fonts
- [x] 1.7 Update `mobile/lib/theme.ts`: add `fontFamily` entries to typography (`typography.display` for serif headings), add gradient colors, add animation timing constants

## 2. Shared Animation Primitives

- [x] 2.1 Create `mobile/components/ui/AnimatedCard.tsx` — a Card variant that uses Reanimated for a subtle scale-down press effect (1 -> 0.97 on press-in, spring back on release). Replaces Card in all list contexts.
- [x] 2.2 Create `mobile/components/ui/AnimatedHeart.tsx` — heart icon that springs (scale 1 -> 1.3 -> 1) and changes color with animation on toggle. Triggers haptic feedback via `expo-haptics`.
- [x] 2.3 Create `mobile/components/ui/Skeleton.tsx` — generic skeleton component that takes `width`, `height`, `borderRadius` and renders a shimmering placeholder using Reanimated (linear gradient sweep). Include presets: `SkeletonCard`, `SkeletonLine`, `SkeletonCircle`.
- [x] 2.4 Create `mobile/components/ui/GradientOverlay.tsx` — a `LinearGradient` component positioned absolute at the bottom of a container, going from transparent to `rgba(0,0,0,0.65)`. Used on image cards for text readability.

## 3. Image-Led Recipe Cards

- [x] 3.1 Create `mobile/components/ui/RecipeCard.tsx` — the new image-led card component:
  - Image fills top portion (aspect ratio 3:2)
  - Gradient overlay on bottom of image
  - Title overlaid on gradient in white
  - Creator name, rating (StarRating), and cook time below the image area
  - When no image: branded warm gradient background with subtle utensils icon
  - Uses AnimatedCard for press effect
  - Props: `recipe` object, `onPress`, `variant?: 'default' | 'compact'`
- [x] 3.2 Update Discover screen to use `RecipeCard` instead of the current Card-based layout
- [x] 3.3 Update My Recipes screen to use `RecipeCard`
- [x] 3.4 Update Public Profile recipe list to use `RecipeCard` (compact variant)

## 4. Home Screen Carousels

- [x] 4.1 Create `mobile/components/ui/HorizontalCarousel.tsx` — a horizontal FlatList with snap-to-card behavior:
  - Card width: `screenWidth * 0.4`
  - Aspect ratio: 4:5
  - Image fills top, title at bottom
  - `snapToInterval`, `decelerationRate="fast"`, `showsHorizontalScrollIndicator={false}`
  - Section header above (title + optional "See all" link)
- [x] 4.2 Refactor home screen: replace vertical "Recently Updated" list with a HorizontalCarousel
- [x] 4.3 Add "Trending This Week" carousel (fetch top-rated public recipes from the last 7 days)
- [x] 4.4 Home screen stats row: add subtle entry animation (fade + slide up) on first render using Reanimated `entering` prop

## 5. Parallax Hero on Recipe Detail

- [x] 5.1 Implement parallax scroll header on recipe detail screen:
  - Hero image height: 280px (or 40% of screen height, whichever is smaller)
  - Parallax ratio: image scrolls at 0.5x the content speed
  - Use `Animated.ScrollView` with `onScroll` mapped to `Reanimated.useAnimatedScrollHandler`
- [x] 5.2 Collapsing header: navigation bar starts transparent over the image, transitions to solid `colors.background` as user scrolls past the image. Use `interpolate` on scroll position for background opacity.
- [x] 5.3 Title in header: when the recipe title scrolls off-screen, fade it into the navigation header bar using interpolated opacity.
- [x] 5.4 When recipe has no image, skip the parallax entirely — render a normal scrollview with content starting at the top.

## 6. Skeleton Loading Screens

- [x] 6.1 Create `mobile/components/skeletons/RecipeListSkeleton.tsx` — 4 skeleton recipe cards stacked vertically, matching the RecipeCard layout (image placeholder + text lines)
- [x] 6.2 Create `mobile/components/skeletons/RecipeDetailSkeleton.tsx` — skeleton for the detail screen (hero image block + title line + metadata pills + ingredient lines)
- [x] 6.3 Create `mobile/components/skeletons/ProfileSkeleton.tsx` — skeleton for profile screens (avatar circle + name line + stats row + recipe card placeholders)
- [x] 6.4 Replace `ActivityIndicator` with skeleton screens in: Home, Discover, My Recipes, Profile, Recipe Detail, Public Profile
- [x] 6.5 Add a subtle stagger effect: skeleton elements appear one by one (50ms delay each) using Reanimated `entering={FadeIn.delay(index * 50)}`

## 7. Micro-Interactions & Haptics

- [x] 7.1 Replace the favorite heart on recipe detail with `AnimatedHeart` (spring bounce + haptic)
- [x] 7.2 Add haptic feedback to: cooking log submit (success), star rating tap (selection), pull-to-refresh release (light impact)
- [x] 7.3 Add spring animation to tab bar icon on selection change (small bounce using `useAnimatedStyle` + `withSpring`)
- [x] 7.4 Add `entering` animations to recipe detail sections (ingredients, steps, cooking log) — staggered FadeInDown for a polished reveal effect

## 8. Custom Typography

- [x] 8.1 Update the "EefEats" header title to use the serif font (Playfair Display or chosen serif)
- [x] 8.2 Update recipe titles on the detail screen to use the serif font
- [x] 8.3 Update section headings on the home screen ("Recently Updated", "Trending") to use the serif font
- [x] 8.4 Update the login screen "EefEats" title to use the serif font
- [ ] 8.5 Verify font rendering on both iOS and Android — serif fonts can render differently

## 9. Lottie Animations

- [x] 9.1 Source or create Lottie JSON files for: empty recipe list, empty search results, cooking celebration, first publish celebration. Save in `mobile/assets/lottie/`
- [x] 9.2 Create `mobile/components/ui/EmptyState.tsx` — component that shows a Lottie animation + title + subtitle. Used for all empty states.
- [x] 9.3 Replace current text-only empty states with `EmptyState` component in: My Recipes (no recipes), Discover (no results), Home (no recent recipes), Cooking Log (not cooked yet)
- [x] 9.4 Add celebration animation: trigger Lottie confetti overlay when a user submits their first cooking log for a recipe
- [x] 9.5 Add celebration animation: trigger when a user publishes their first recipe

## 10. Final Polish & Performance Audit

- [ ] 10.1 Test all animations at 60fps on a physical iOS device using Xcode's Core Animation instrument
- [ ] 10.2 Test on a mid-range Android device (e.g., Pixel 4a or equivalent) to verify performance
- [ ] 10.3 Verify all skeleton screens match the actual content layout (no layout shift when data loads)
- [ ] 10.4 Verify haptics work on iOS and gracefully no-op on Android
- [x] 10.5 Run `npx tsc --noEmit` — zero errors
- [ ] 10.6 Full visual review of every screen on both iOS and Android for consistency
