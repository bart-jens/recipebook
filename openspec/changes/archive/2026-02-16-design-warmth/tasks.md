## 0. Logo

- [x] 0.1 Create SVG wordmark (`public/logo.svg`): full "EefEats" wordmark where the first E has fork tines as horizontal strokes. Fork-E in teal (#2D5F5D), remaining letters in #111111, DM Sans Bold base. Include `height` and `width` attributes for consistent sizing.
- [x] 0.2 Create SVG mark (`public/logo-mark.svg`): fork-E only, white on transparent — used for favicon/app icon generation.
- [x] 0.3 Create web Logo component (`src/components/logo.tsx`): renders the SVG inline with configurable height prop (default 24px). Used across web header, login, signup.
- [x] 0.4 Update web header (`src/app/(authenticated)/layout.tsx`): replace plain text "EefEats" with Logo component at 24px height.
- [x] 0.5 Update web login page (`src/app/login/page.tsx`): replace plain text "EefEats" heading with Logo component at 48px height. Remove the pulsing circle behind it.
- [x] 0.6 Update web signup page (`src/app/signup/page.tsx`): same as login — Logo component at 48px height.
- [x] 0.7 Update `public/apple-icon.png`: white fork-E mark centered on teal (#2D5F5D) background, 180x180px.
- [x] 0.8 Update `public/favicon.ico`: white fork-E mark on teal background, 32x32px.
- [x] 0.9 Copy wordmark SVG to mobile (`mobile/assets/logo.svg`), create mobile Logo component (`mobile/components/ui/Logo.tsx`) using react-native-svg. Configurable height prop.
- [x] 0.10 Update mobile login screen (`mobile/app/(auth)/login.tsx`): replace plain text "EefEats" with Logo component at 48px height.
- [x] 0.11 Update mobile signup screen (`mobile/app/(auth)/signup.tsx`): replace plain text "EefEats" with Logo component at 48px height.
- [x] 0.12 Update mobile tab header (`mobile/app/(tabs)/_layout.tsx`): replace plain text "EefEats" headerTitle with Logo component at 24px height.
- [x] 0.13 Update Expo app icon (`mobile/assets/icon.png`): white fork-E mark centered on teal background, 1024x1024px.

## 1. Design Tokens

- [x] 1.1 Add teal wash color tokens to mobile theme.ts: `accentWash` (accent at 5% opacity → `rgba(45,95,93,0.05)`), `accentWashBorder` (accent at 20% → `rgba(45,95,93,0.20)`), `accentWashIcon` (accent at 40% → `rgba(45,95,93,0.40)`)
- [x] 1.2 Add teal wash utilities to web Tailwind config: ensure `accent/5`, `accent/10`, `accent/20`, `accent/40` opacity variants work (Tailwind supports this natively with `bg-accent/5`)
- [x] 1.3 Re-enable card press animation tokens in mobile theme.ts: `pressScale: 0.98`, `pressSpring: { damping: 25, stiffness: 200 }`, `buttonPressScale: 0.96`
- [x] 1.4 Add stagger animation token: `listStaggerDelay: 30` (ms per item), `listStaggerMax: 10` (max items to animate)

## 2. Mobile Components

- [x] 2.1 Update RecipeCard: add press scale animation (0.98x spring) using Animated.View, replace flat gray placeholder with teal wash background + accent-colored initial letter
- [x] 2.2 Update AnimatedCard: re-enable scale animation on press (0.98x), keep opacity as secondary feedback
- [x] 2.3 Update EmptyState: replace dashed gray border with teal wash background (`accentWash`), solid `accentWashBorder`, add FontAwesome icon prop (rendered in `accentWashIcon` color above title)
- [x] 2.4 Update tab bar (_layout.tsx): add 4px teal dot below active tab icon, keep existing bounce animation on selection

## 3. Mobile Screens

- [x] 3.1 Update Home screen: add staggered FadeInDown on feed items (30ms delay, max 10)
- [x] 3.2 Update Recipes screen: add staggered entry on recipe list items
- [x] 3.3 Update Discover screen: add staggered entry on recipe cards
- [x] 3.4 Update all EmptyState usages: add appropriate icon prop (book for recipes, compass for discover, fire for cooking log, users for activity feed)

## 4. Web Updates

- [x] 4.1 Update web card hover: replace `hover:opacity-80` with `hover:-translate-y-px hover:shadow-sm` on recipe cards across all pages (home, discover, recipes, profile)
- [x] 4.2 Update web empty states: replace `border-dashed border-warm-border/50` with `bg-accent/5 border border-accent/20` across all pages
- [x] 4.3 Add stagger animation to web feed items and recipe grids: use CSS animation-delay with `fadeInUp` keyframe
- [x] 4.4 Add button active state: `active:scale-[0.98]` on primary buttons

## 5. Verification

- [x] 5.1 Run build on both platforms
- [x] 5.2 Visual review: logo renders correctly at all sizes, teal washes visible but subtle, animations snappy not sluggish, empty states feel branded
- [x] 5.3 Verify no plain-text "EefEats" remains in headers, login, signup, or tab bars (all replaced by Logo component)
