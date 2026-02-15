# Mobile Visual Overhaul — Animations, Layout, and Polish

## Why

With recipe images in place (prerequisite: `add-recipe-images`), the app has visual content to work with. But displaying images in basic cards isn't enough — premium recipe apps use motion, layout sophistication, and micro-interactions to create an experience that feels alive. The current app feels static: tap something, content appears. There's no sense of physicality, no delight, no reason to prefer the app over a browser bookmark.

This change transforms the mobile app from "functional with images" to "feels like a product someone would pay for."

## What Changes

**Image-led card redesign.** Recipe cards become visually rich: image fills the top of the card, title overlays the bottom with a gradient, ratings and time pills float on top. Cards in discover use a staggered/masonry layout.

**Parallax hero on recipe detail.** The hero image scrolls at a slower rate than the content, creating depth. The title and metadata fade in as the user scrolls past the image. The header becomes translucent over the image, transitioning to solid as the user scrolls.

**Horizontal carousels on home screen.** "Recently Updated" and new sections like "Trending This Week" and "Cooked by Friends" use horizontal scroll carousels with snap-to-card behavior. Each card shows image + title in a compact square format.

**Animated micro-interactions.** Favorite heart bounces with spring physics when toggled. Cards have a subtle scale-down press effect. Skeleton shimmer screens replace flat spinners. Pull-to-refresh uses a custom branded animation.

**Custom typography.** A serif display font (Playfair Display) for headings and the app title, adding warmth and personality that matches the EefEats brand.

**Haptic feedback.** Subtle haptics on favorite toggle, cooking log submit, and pull-to-refresh completion — making the app feel tactile.

**Lottie animations.** Animated illustrations for empty states (no recipes yet, no search results) and celebrations (first cook, 5th cook milestone).

## Capabilities

### New Capabilities
- `mobile-visual` — Animations, transitions, layout systems, and micro-interactions for the mobile app

### Modified Capabilities
- `mobile-app` — All existing screens get visual treatment; home screen gets carousels; detail screen gets parallax

## Impact

- **New dependencies:** `react-native-reanimated` (v3), `expo-haptics`, `lottie-react-native`, `@expo-google-fonts/playfair-display` (or similar serif font), `expo-linear-gradient`
- **Modified dependencies:** `expo-image` (already installed from add-recipe-images)
- **New assets:** Lottie JSON files for empty states and celebrations (~50KB each)
- **Modified screens:** All 6+ mobile screens get animation and layout upgrades
- **Performance note:** Reanimated 3 runs on the native thread — no JS bridge bottleneck. Animations stay at 60fps even during heavy JS work.

## Free vs Premium Considerations

All visual polish is available to all users — it's the product's baseline quality, not a premium feature. However, future animated stickers/reactions on cooking logs could be premium-only.
