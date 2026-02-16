## Context

The design-refresh change (archived 2026-02-16) stripped the UI to bare essentials: single typeface, monochrome palette, zero shadows, zero animations (except heart), flat cards with 1px borders. The result is sharp and clean but lifeless. This change reintroduces personality while keeping the structural clarity.

## Goals / Non-Goals

**Goals:**
- Make the app feel warm and inviting without becoming cluttered
- Use teal as a personality color, not just a functional accent
- Add subtle motion that makes the app feel responsive and alive
- Keep the flat, clean structural foundation from the design refresh

**Non-Goals:**
- Reverting to the old heavy shadow/gradient system
- Adding serif fonts back
- Complex Lottie animations or celebration overlays
- Changing the layout structure or information architecture

## Decisions

### 1. Playful EefEats wordmark

**Decision:** Create a custom SVG wordmark where the first "E" incorporates a fork silhouette (the fork tines form the horizontal strokes of the E). The wordmark uses DM Sans Bold as the base typeface for the remaining letters. The fork-E is rendered in the teal accent color; the rest of the word is dark (#111111). This wordmark replaces all plain-text "EefEats" instances across both platforms.

**Rationale:** A plain text logo is forgettable. The fork-in-E motif is simple, geometric, and instantly communicates "food" without resorting to clipart or illustration. It's recognizable at small sizes (tab header, app icon) and scales well to large sizes (login screen). Using the accent color on just the fork-E creates a consistent brand anchor that ties into the teal design system.

**Where used:**
- Web header (authenticated layout) — SVG component, ~24px height
- Web login/signup — SVG component, ~48px height
- Mobile login/signup — SVG component, ~48px height
- Mobile tab header — SVG component, ~24px height
- App icon (apple-icon.png, favicon.ico) — Fork-E mark on teal background
- Mobile app icon (Expo) — Fork-E mark on teal background

**Assets needed:**
- `public/logo.svg` (web) — full wordmark
- `public/logo-mark.svg` (web) — fork-E only (for favicon/app icon contexts)
- `mobile/assets/logo.svg` — full wordmark (used via react-native-svg)
- Updated `public/apple-icon.png` and `public/favicon.ico` — fork-E mark on teal

### 2. Teal wash backgrounds

**Decision:** Introduce `accent/5` (#2D5F5D at 5% opacity) and `accent/10` (10% opacity) as surface colors for key areas: empty states, the activity feed section background, and recipe card placeholders (no-image state).

**Rationale:** Pure gray (#F5F5F5) is neutral but cold. A barely-visible teal tint creates warmth and brand identity without competing with content. The 5% opacity ensures readability and subtlety.

**Where used:**
- Empty state containers: `accent/5` background with `accent/20` border (replacing dashed gray)
- Recipe card no-image placeholder: `accent/5` background with teal initial letter
- Activity feed section: no background (keep clean), but feed empty states get the teal wash

### 3. Gentle card press scale

**Decision:** Bring back a subtle 0.98x scale on card press (mobile) and a slight translateY(-1px) + subtle shadow on hover (web). Use CSS transition / Reanimated spring with high damping.

**Rationale:** The current opacity-only feedback feels flat. A tiny scale gives tactile feedback without the bouncy cartoon feel of the old 0.97x spring animation. High damping (25) ensures it feels snappy, not wobbly.

**Mobile:** `Animated.View` with `withSpring(0.98, { damping: 25, stiffness: 200 })` on press in, `withSpring(1)` on press out.
**Web:** `transition: transform 150ms ease, box-shadow 150ms ease; &:hover { transform: translateY(-1px); box-shadow: 0 2px 8px rgba(0,0,0,0.06); }`

### 4. Staggered list entry animations

**Decision:** Recipe list items and feed items animate in with `FadeInDown` (mobile) or CSS `@keyframes fadeInUp` (web), staggered by 30ms per item, max 10 items animated.

**Rationale:** Lists that pop into existence feel jarring. A subtle stagger (faster than the old 50ms) makes the interface feel polished. Capping at 10 items prevents animation fatigue on long lists.

### 5. Tab bar active indicator

**Decision:** Replace the simple color change on the active tab icon with a small teal dot (4px circle) positioned below the icon. Keep the icon color change too.

**Rationale:** The dot adds a clear, playful active-state indicator that's more visually distinct than just a color shift. Common pattern in modern apps (Instagram, Spotify).

### 6. Tab icon bounce on selection

**Decision:** When a tab is selected, its icon does a quick bounce animation (scale 1 → 1.15 → 1, spring with high damping). This already exists in the codebase but was muted — re-enable it.

**Rationale:** The bounce on the tab bar is low-risk playfulness. It only fires on tap (not on load), so it doesn't slow down perception of the app.

### 7. Warmer empty states

**Decision:** Empty states get a light teal background (`accent/5`), a solid `accent/20` border (not dashed), and a simple teal-colored icon (using FontAwesome icons, not Lottie). Title stays dark, subtitle stays secondary.

**Rationale:** The dashed gray boxes feel like unfinished UI. A teal-tinted container with an icon feels intentional and branded. FontAwesome icons are already in the project — no new dependency.

### 8. Button press micro-interaction

**Decision:** Primary buttons get a 0.96x scale on press (mobile) with spring physics. Web buttons get a subtle `transform: scale(0.98)` on `:active`.

**Rationale:** Buttons are the primary interactive element — they should feel responsive. This is a standard mobile pattern.

### 9. Web card hover with subtle lift

**Decision:** On hover, web cards get `transform: translateY(-1px)` and a very light shadow `box-shadow: 0 2px 8px rgba(0,0,0,0.06)`. On press/active, the transform goes to `translateY(0)` (press-down feel).

**Rationale:** Replaces the current `opacity: 0.8` hover which feels like the card is fading/broken. The lift gives a physical "pick up" metaphor that's more intuitive.

## Risks / Trade-offs

**[Animation performance]** → All animations use native driver (Reanimated) or CSS transforms. No JS-driven animations that could drop frames. Spring configs use high damping to resolve quickly.

**[Teal overuse]** → The 5% opacity wash is barely visible — intentionally. If it reads as "too colored" on certain screens, reduce to 3%. The principle is "atmosphere, not decoration."

**[Scope creep from old design]** → This is explicitly NOT reverting to the old design. No gradients, no serif, no heavy shadows. It's seasoning on the clean foundation, not a redesign.
