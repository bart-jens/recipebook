## Why

The recent design refresh removed all color, shadow, and animation — creating a clean but sterile experience. The app now feels clinical rather than inviting. A recipe app should feel warm and alive, not like a spreadsheet. We need to reintroduce the teal accent more generously, add subtle motion, and inject personality — without undoing the clarity and restraint we gained.

## What Changes

- **Playful EefEats wordmark** — Replace the plain text "EefEats" with a custom SVG wordmark featuring a fork integrated into the letter "E". The wordmark becomes a recognizable brand element used consistently across web header, login/signup, mobile login/signup, mobile tab header, and app icon. The fork motif is simple and geometric — not clipart.
- **Teal accent expansion** — Use teal beyond just buttons/links: light teal washes on key sections (activity feed, empty states), teal-tinted placeholder backgrounds on recipe cards, teal active indicator on tab bar.
- **Subtle card motion** — Bring back a gentle scale on press (0.98x, not the old heavy 0.97x spring). Add hover lift on web.
- **Staggered list entry** — Feed items and recipe lists animate in with a subtle stagger (fade + slight slide).
- **Tab bar personality** — Active tab gets a small teal dot indicator below the icon. Tab icon gently bounces on selection change.
- **Warmer empty states** — Replace dashed-border boxes with teal-accented containers that have a light teal background and a simple illustration/icon.
- **Micro-interactions** — Button press scale, toast slide-in, feed item appearance. Small moments that add life.

## Capabilities

### New Capabilities
_None — this builds on existing visual design system capabilities._

### Modified Capabilities
- `visual-design-system`: Relax the "restrained color" requirement to allow teal washes on non-interactive surfaces. Add animation tokens. Update card interaction spec.
- `mobile-visual`: Update card press behavior, add staggered list animations, update empty state styling.

## Impact

- **Logo assets**: New SVG wordmark (`logo.svg`), updated app icon (`apple-icon.png`, `favicon.ico`), mobile app icon.
- **Mobile theme.ts**: New color tokens (teal wash backgrounds), re-enable subtle shadow or scale on cards, animation timing tokens.
- **Web Tailwind config**: Add teal wash utility colors (`accent/5`, `accent/10`).
- **Web layout**: Header, login, signup — replace plain text with SVG wordmark component.
- **Mobile screens**: Login, signup, tab header — replace plain text with SVG wordmark component.
- **Mobile components**: RecipeCard, AnimatedCard, EmptyState, tab bar layout — animation and color updates.
- **Web components**: Card hover effects, empty state styling, activity feed item animations.
- **No database changes. New dependency: react-native-svg (for mobile SVG wordmark).**
