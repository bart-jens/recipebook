# Design: Mobile Visual Overhaul

## Context

With recipe images available (from the `add-recipe-images` change), the app has visual content but displays it statically in flat cards. Competing apps (Mela, Paprika, NYT Cooking, Tasty) use motion, depth, and layout sophistication to feel premium. This change adds the animation layer and layout upgrades needed to match that standard.

## Goals

- Make every interaction feel physical and responsive (spring animations, haptics)
- Use images as the primary visual element (not decorating text — leading with images)
- Create depth through parallax, layering, and shadow hierarchy
- Replace all loading spinners with skeleton screens
- Add delight moments (celebrations, animated empty states)
- Maintain 60fps throughout — never sacrifice performance for visuals

## Non-Goals

- Custom navigation library or gesture-based navigation (use Expo Router's built-in transitions)
- 3D effects or AR features
- Video content support
- Dark mode (future change — design the visual system to support it later)

## Decisions

### 1. React Native Reanimated 3 for all animations

**Decision:** Use Reanimated 3 as the single animation library for all motion in the app.

**Rationale:** Reanimated 3 runs animations on the native UI thread, guaranteeing 60fps even when the JS thread is busy (fetching data, parsing JSON). It supports spring physics, shared values, layout animations, and gesture-driven interactions. It's the React Native community standard.

**Alternative considered:** React Native Animated (built-in). Rejected because it runs on the JS thread by default (jank during data loads), has no spring physics, and requires `useNativeDriver` flags that limit what properties can be animated.

### 2. Image-led card design with gradient overlay

**Decision:** Recipe cards in discover and my-recipes put the image first (top 60% of the card), with the title, creator, and rating overlaid on a gradient at the bottom of the image. Cards without images use a branded gradient background (warm tones matching the EefEats palette) with a subtle utensils icon.

**Rationale:** This is the proven pattern used by Airbnb, Pinterest, and every successful food app. The image creates emotional engagement; the gradient ensures text readability without covering the image.

**Gradient spec:** Linear gradient from `transparent` to `rgba(0,0,0,0.7)`, bottom 40% of the image area.

**Alternative considered:** Image as a small thumbnail with text beside it (like the current cards). Rejected because it fails to create visual impact — the image is too small to evoke emotion.

### 3. Parallax hero with collapsing header

**Decision:** Recipe detail screen uses a parallax hero image (scrolls at 0.5x the content speed). As the user scrolls past the image, the navigation header transitions from transparent (over the image) to solid (brand background color). The recipe title appears in the header once the original title scrolls off-screen.

**Rationale:** This is the standard "premium detail screen" pattern (used by Apple Music, Airbnb, Uber Eats). It maximizes the visual impact of the hero image while maintaining usability as the user scrolls into the content.

**Implementation:** Use `Animated.ScrollView` with `onScroll` driving shared values for: image translateY (parallax), header opacity, and title opacity. All animated via Reanimated worklets (native thread).

**Alternative considered:** Static hero image. Rejected because it wastes the opportunity for the most impactful animation in the app — the one the user sees on every recipe they open.

### 4. Horizontal carousels with snap behavior

**Decision:** The home screen uses horizontal `FlatList` carousels for recipe sections: "Recently Updated", "Trending This Week" (if discover data is available), and "Cooked by Friends" (if social data exists). Cards snap to center alignment.

**Rationale:** Horizontal carousels are the standard mobile pattern for browsable collections (Netflix, Spotify, App Store). They're more space-efficient than vertical lists and encourage exploration.

**Card format:** Square-ish cards (width: screen width * 0.4, aspect ratio 4:5) with image filling the top, title and a single metadata line at the bottom.

**Snap behavior:** `snapToInterval` with `decelerationRate="fast"` for crispy snap behavior.

**Alternative considered:** Vertical list for everything (current design). Rejected because it's monotonous and doesn't distinguish content types.

### 5. Skeleton loading screens

**Decision:** Replace all `ActivityIndicator` spinners with content-shaped skeleton screens that shimmer. Each screen has its own skeleton layout that matches the content layout.

**Rationale:** Skeleton screens feel faster than spinners (proven by UX research — Facebook, LinkedIn, Slack all switched years ago). They also prevent layout shift when content loads.

**Implementation:** Use Reanimated to drive a shimmer animation (a linear gradient that sweeps left-to-right across gray placeholder shapes). Create skeleton variants for: card list, recipe detail, and profile.

**Alternative considered:** Third-party skeleton library (e.g., `react-native-skeleton-placeholder`). Acceptable alternative if building custom skeletons takes too long, but custom Reanimated skeletons are more performant and match the exact layout.

### 6. Spring-based micro-interactions

**Decision:** Use spring physics (not duration-based easing) for all interactive animations:
- **Favorite heart:** Scale 1 -> 1.3 -> 1 with spring (damping: 4, stiffness: 200) + color transition
- **Card press:** Scale 1 -> 0.97 with spring on press-in, back to 1 on press-out
- **Cooking log submit:** Checkmark draws on with spring, then a small confetti burst (Lottie)
- **Tab bar icons:** Bounce on selection change

**Rationale:** Springs feel natural because they model real physics (mass, tension, friction). Duration-based easing feels robotic. Apple's iOS uses springs for almost every system animation.

**Alternative considered:** CSS-style easing curves (`ease-in-out`). Rejected because they feel artificial and don't respond naturally to interruption (springs do).

### 7. Custom serif font for headings

**Decision:** Add Playfair Display (or similar high-quality serif) as the heading font. Use it for: the "EefEats" title in the header, recipe titles on detail screens, section headings on the home screen, and the login screen title.

**Rationale:** A serif heading font adds warmth and personality that differentiates the app from the default system font aesthetic. It matches the "personal recipe book started by a couple" brand positioning. Body text stays as system font for readability.

**Loading:** Loaded via `expo-font` at app startup (already loading FontAwesome this way). Playfair Display is ~100KB for regular + bold weights.

**Alternative considered:** Libre Baskerville, Lora, Merriweather. All acceptable — the choice is aesthetic. Playfair Display has high contrast and elegance that suits a food context.

### 8. Haptic feedback for key actions

**Decision:** Use `expo-haptics` to add subtle tactile feedback:
- **Favorite toggle:** `impactAsync(ImpactFeedbackStyle.Medium)`
- **Cooking log submit:** `notificationAsync(NotificationFeedbackType.Success)`
- **Pull-to-refresh release:** `impactAsync(ImpactFeedbackStyle.Light)`
- **Star rating tap:** `selectionAsync()` (lightest haptic, good for quick taps)

**Rationale:** Haptics make the app feel physical and responsive. They're the difference between "I tapped a button" and "I did something." iOS users especially expect haptic feedback in polished apps.

**Platform handling:** Haptics are iOS-only in many cases. `expo-haptics` gracefully no-ops on Android devices without haptic hardware. No conditional code needed.

### 9. Lottie animations for delight moments

**Decision:** Use `lottie-react-native` for:
- **Empty states:** An animated illustration (e.g., an empty plate, a chef looking around) when the user has no recipes, no search results, or no cooking logs
- **Celebrations:** A small confetti or sparkle animation when the user logs their first cook, reaches a milestone (5 cooks, 10 recipes), or publishes their first recipe
- **Pull-to-refresh:** A custom branded animation (e.g., a small pot stirring) during pull-to-refresh

**Rationale:** Lottie animations are GPU-accelerated, tiny in file size (JSON, typically 20-50KB), and can be sourced from LottieFiles or created in After Effects. They're the industry standard for micro-animations in mobile apps.

**Alternative considered:** Rive animations. Rive is more powerful but overkill for our needs and has a smaller community/asset library.

## Risks / Trade-offs

**Bundle size increase.** Reanimated (~200KB), Lottie (~150KB), custom font (~100KB), and Lottie JSON files (~200KB total) add ~650KB to the app bundle. Acceptable for the quality improvement.

**Animation performance on low-end Android.** Reanimated 3 runs on the native thread, so it should perform well. However, complex layout animations combined with large image lists may stutter on devices with <3GB RAM. Mitigate by: using `expo-image` (native image caching), keeping animated views simple, and testing on a budget Android device.

**Development complexity.** Reanimated has a learning curve (worklets, shared values, etc.). However, once the base patterns are built (animated card, parallax scroll, skeleton), they're reusable across all screens.

**Lottie asset sourcing.** Need to find or create Lottie animations that match the EefEats brand. LottieFiles has free food-themed animations. Budget 1-2 hours for selection and customization.
