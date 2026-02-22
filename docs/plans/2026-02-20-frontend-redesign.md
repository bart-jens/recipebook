# Frontend Redesign Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Redesign the EefEats frontend from a generic teal/DM Sans aesthetic to the approved "Type-Heavy Modernist" editorial design — typography-forward, warm cream palette, burnt sienna accent, micro-interactions — across both web (Next.js) and mobile (React Native/Expo).

**Architecture:** Visual-only redesign. No data model or API changes. All existing functionality preserved, only the visual layer changes. Both platforms updated in lockstep to maintain parity. New fonts (Instrument Serif, Inter Tight, Geist Mono) replace DM Sans + Outfit across all screens.

**Tech Stack:** Next.js 14 + Tailwind CSS (web), React Native + Expo + Reanimated (mobile), Google Fonts (both), SVG for logo mark.

**Reference Prototype:** `docs/design-preview/type-heavy-modernist-v2.html`
**Design Spec:** `docs/plans/2026-02-20-frontend-redesign-design.md`

---

## Phase 1: Design Foundation

### Task 1: Update Web Tailwind Config + Global CSS

Replace the existing color palette, font families, and animations with the new design tokens.

**Files:**
- Modify: `tailwind.config.ts`
- Modify: `src/app/globals.css`

**Step 1: Update `tailwind.config.ts`**

Replace the entire theme extension:

```ts
import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Instrument Serif"', 'Georgia', 'serif'],
        body: ['"Inter Tight"', 'system-ui', 'sans-serif'],
        mono: ['"Geist Mono"', 'monospace'],
        // Keep sans as alias for body (used throughout codebase)
        sans: ['"Inter Tight"', 'system-ui', 'sans-serif'],
      },
      keyframes: {
        fadeInUp: {
          "0%": { opacity: "0", transform: "translateY(18px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideInLeft: {
          "0%": { opacity: "0", transform: "translateX(-14px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        lineGrow: {
          "0%": { transform: "scaleX(0)" },
          "100%": { transform: "scaleX(1)" },
        },
        heroZoom: {
          "0%": { transform: "scale(1.08)" },
          "100%": { transform: "scale(1)" },
        },
        checkPop: {
          "0%": { transform: "scale(1)" },
          "40%": { transform: "scale(1.25)" },
          "100%": { transform: "scale(1)" },
        },
        scaleIn: {
          "0%": { opacity: "0", transform: "scale(0.94)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
      },
      animation: {
        "fade-in-up": "fadeInUp 0.55s cubic-bezier(0.16,1,0.3,1) forwards",
        "fade-in": "fadeIn 0.4s ease forwards",
        "slide-in-left": "slideInLeft 0.5s cubic-bezier(0.16,1,0.3,1) forwards",
        "line-grow": "lineGrow 0.6s cubic-bezier(0.22,1,0.36,1) forwards",
        "hero-zoom": "heroZoom 0.8s cubic-bezier(0.16,1,0.3,1) forwards",
        "check-pop": "checkPop 0.3s cubic-bezier(0.34,1.56,0.64,1)",
        "scale-in": "scaleIn 0.45s cubic-bezier(0.16,1,0.3,1) forwards",
      },
      colors: {
        bg: "#F6F4EF",
        surface: {
          DEFAULT: "#FFFFFF",
          alt: "#EDEADE",
        },
        ink: {
          DEFAULT: "#141210",
          secondary: "#5C5850",
          muted: "#9C978C",
        },
        border: {
          DEFAULT: "#D6D2C8",
          strong: "#141210",
        },
        accent: {
          DEFAULT: "#8B4513",
          light: "rgba(139,69,19,0.07)",
        },
        olive: {
          DEFAULT: "#4A5D3A",
          light: "rgba(74,93,58,0.08)",
        },
        // Keep old tokens as aliases during migration
        warm: {
          gray: "#5C5850",
          border: "#D6D2C8",
          divider: "#D6D2C8",
          tag: "#EDEADE",
          surface: "#EDEADE",
        },
        cta: {
          DEFAULT: "#8B4513",
          hover: "#6D360F",
        },
      },
    },
  },
  plugins: [],
};
export default config;
```

**Step 2: Update `src/app/globals.css`**

Replace font import and base styles:

```css
@import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Geist+Mono:wght@400;500&family=Inter+Tight:ital,wght@0,300;0,400;0,500;0,600;0,700;1,300;1,400&display=swap');

@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  body {
    @apply bg-bg text-ink font-body antialiased;
    font-size: 14px;
    line-height: 1.5;
  }

  ::selection {
    @apply bg-accent text-white;
  }
}

@layer utilities {
  .scrollbar-hide {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
  .scrollbar-hide::-webkit-scrollbar {
    display: none;
  }
}

@layer components {
  /* Horizontal rules as design elements */
  .rule-thick {
    @apply h-[3px] bg-ink border-none m-0;
  }
  .rule-thin {
    @apply h-px bg-border border-none m-0;
  }

  /* Monospace metadata label */
  .mono-label {
    @apply font-mono text-[10px] uppercase tracking-[0.14em] text-ink-muted;
  }
  .mono-meta {
    @apply font-mono text-[11px] text-ink-muted;
  }

  /* Serif section titles */
  .serif-title {
    @apply font-display tracking-[-0.02em] text-ink;
  }

  /* Animation delay utilities */
  .anim-delay-1 { animation-delay: 40ms; }
  .anim-delay-2 { animation-delay: 80ms; }
  .anim-delay-3 { animation-delay: 120ms; }
  .anim-delay-4 { animation-delay: 160ms; }
  .anim-delay-5 { animation-delay: 200ms; }
  .anim-delay-6 { animation-delay: 240ms; }
  .anim-delay-7 { animation-delay: 280ms; }
  .anim-delay-8 { animation-delay: 320ms; }
  .anim-delay-9 { animation-delay: 360ms; }
  .anim-delay-10 { animation-delay: 400ms; }
}
```

**Step 3: Verify it compiles**

Run: `cd /Users/bart/claude/together-map && npm run build`
Expected: Build succeeds (may have style issues on pages — that's fine for now)

**Step 4: Commit**

```bash
git add tailwind.config.ts src/app/globals.css
git commit -m "feat: update web design tokens — new palette, fonts, animations for Type-Heavy Modernist redesign"
```

---

### Task 2: Update Mobile Theme Tokens

Replace all mobile design tokens with the new palette, typography, and animation configs.

**Files:**
- Modify: `mobile/lib/theme.ts`
- Modify: `mobile/app/_layout.tsx` (font loading)

**Step 1: Update `mobile/lib/theme.ts`**

Replace the entire file with new tokens. Key changes:
- Colors: warm cream bg (#F6F4EF), ink (#141210), burnt sienna accent (#8B4513)
- Fonts: Instrument Serif (display), Inter Tight (body), Geist Mono (metadata)
- Typography: new scale matching the prototype
- Animation: spring configs for micro-interactions

```ts
import { Platform, TextStyle } from 'react-native';

export const colors = {
  // Core palette
  bg: '#F6F4EF',
  surface: '#FFFFFF',
  surfaceAlt: '#EDEADE',
  ink: '#141210',
  inkSecondary: '#5C5850',
  inkMuted: '#9C978C',
  border: '#D6D2C8',
  borderStrong: '#141210',
  accent: '#8B4513',
  accentLight: 'rgba(139,69,19,0.07)',
  olive: '#4A5D3A',
  oliveLight: 'rgba(74,93,58,0.08)',

  // Semantic aliases (map old names → new values for migration)
  primary: '#8B4513',
  primaryLight: 'rgba(139,69,19,0.15)',
  primaryDark: '#6D360F',
  cta: '#8B4513',
  ctaHover: '#6D360F',
  background: '#F6F4EF',
  card: '#FFFFFF',
  text: '#141210',
  textSecondary: '#5C5850',
  textMuted: '#9C978C',
  textOnPrimary: '#FFFFFF',
  borderLight: '#D6D2C8',

  // Functional colors
  starFilled: '#8B4513',
  starEmpty: '#D6D2C8',
  success: '#4A5D3A',
  successBg: 'rgba(74,93,58,0.08)',
  successBorder: 'rgba(74,93,58,0.20)',
  danger: '#DC2626',
  dangerLight: '#EF4444',
  dangerBg: '#FEF2F2',
  dangerBorder: '#FECACA',
  white: '#FFFFFF',

  // Gradient / overlay
  gradientOverlayStart: 'transparent',
  gradientOverlayEnd: '#F6F4EF',

  // Skeleton
  skeletonBase: '#D6D2C8',
  skeletonHighlight: '#EDEADE',

  // Accent wash
  accentWash: 'rgba(139,69,19,0.05)',
  accentWashBorder: 'rgba(139,69,19,0.20)',
  accentWashIcon: 'rgba(139,69,19,0.40)',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  pagePadding: 20,
  sectionGap: 32,
} as const;

export const fontFamily = {
  // Display — Instrument Serif for recipe titles, headings, section titles
  display: 'InstrumentSerif_400Regular',
  displayItalic: 'InstrumentSerif_400Regular_Italic',
  // Body — Inter Tight for all body text, UI labels
  sans: 'InterTight_400Regular',
  sansMedium: 'InterTight_500Medium',
  sansBold: 'InterTight_700Bold',
  sansLight: 'InterTight_300Light',
  // Mono — Geist Mono for metadata, categories, timestamps
  mono: 'GeistMono_400Regular',
  monoMedium: 'GeistMono_500Medium',
  // Logo — Inter Tight Bold
  logo: 'InterTight_700Bold',
  // System fallback
  system: Platform.OS === 'ios' ? 'System' : 'Roboto',
  // Backward compat aliases
  serif: 'InstrumentSerif_400Regular',
  serifSemiBold: 'InstrumentSerif_400Regular',
  serifBold: 'InstrumentSerif_400Regular',
} as const;

export const typography: Record<string, TextStyle> = {
  // Display — Instrument Serif
  display: { fontSize: 40, fontFamily: fontFamily.display, lineHeight: 40 },
  displaySmall: { fontSize: 28, fontFamily: fontFamily.display, lineHeight: 30 },
  // Section titles — Instrument Serif
  sectionTitle: { fontSize: 18, fontFamily: fontFamily.display, lineHeight: 22 },
  // Headings — Instrument Serif
  h1: { fontSize: 32, fontFamily: fontFamily.display, lineHeight: 34 },
  h2: { fontSize: 28, fontFamily: fontFamily.display, lineHeight: 30 },
  h3: { fontSize: 20, fontFamily: fontFamily.display, lineHeight: 24 },
  // Body — Inter Tight
  body: { fontSize: 14, fontFamily: fontFamily.sans, lineHeight: 21 },
  bodySmall: { fontSize: 13, fontFamily: fontFamily.sansLight, lineHeight: 19 },
  bodyLight: { fontSize: 13, fontFamily: fontFamily.sansLight, lineHeight: 19 },
  label: { fontSize: 14, fontFamily: fontFamily.sansMedium, lineHeight: 20 },
  caption: { fontSize: 12, fontFamily: fontFamily.sans, lineHeight: 16 },
  // Mono — Geist Mono for metadata
  monoLabel: { fontSize: 10, fontFamily: fontFamily.mono, textTransform: 'uppercase', letterSpacing: 1.4 },
  monoMeta: { fontSize: 11, fontFamily: fontFamily.mono },
  // Heading aliases
  heading: { fontSize: 22, fontFamily: fontFamily.display, lineHeight: 26 },
  headingSmall: { fontSize: 18, fontFamily: fontFamily.display, lineHeight: 22 },
} as const;

export const radii = {
  none: 0,
  sm: 6,
  md: 8,
  lg: 12,
  xl: 16,
  full: 999,
} as const;

export const shadows = Platform.select({
  ios: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
  },
  android: {
    elevation: 0,
  },
  default: {},
}) as Record<string, unknown>;

export const animation = {
  // Spring configs
  springConfig: { damping: 15, stiffness: 150, mass: 0.8 },
  pressSpring: { damping: 25, stiffness: 200 },
  springBounce: { damping: 12, stiffness: 180, mass: 0.6 },
  // Press states
  pressScale: 0.995,
  buttonPressScale: 0.94,
  tabPressScale: 0.88,
  pressOpacity: 0.7,
  // Hover-like scales
  heartScale: 1.25,
  imageHoverScale: 1.08,
  avatarHoverScale: 1.12,
  checkPopScale: 1.25,
  // Stagger
  staggerDelay: 40,
  staggerMax: 10,
  // Skeleton
  skeletonDuration: 1200,
  // Entry animations
  fadeInUpDistance: 18,
  fadeInDuration: 550,
} as const;
```

**Step 2: Update font loading in `mobile/app/_layout.tsx`**

Replace DM Sans + Outfit font imports with Instrument Serif + Inter Tight + Geist Mono.

Add these imports (exact package names from expo-google-fonts):
```ts
import { InstrumentSerif_400Regular, InstrumentSerif_400Regular_Italic } from '@expo-google-fonts/instrument-serif';
import { InterTight_300Light, InterTight_400Regular, InterTight_500Medium, InterTight_600SemiBold, InterTight_700Bold, InterTight_300Light_Italic, InterTight_400Regular_Italic } from '@expo-google-fonts/inter-tight';
import { GeistMono_400Regular, GeistMono_500Medium } from '@expo-google-fonts/geist-mono';
```

Update the `useFonts` call to load these instead of DM Sans and Outfit.

**Step 3: Install the font packages**

Run:
```bash
cd /Users/bart/claude/together-map/mobile
npx expo install @expo-google-fonts/instrument-serif @expo-google-fonts/inter-tight @expo-google-fonts/geist-mono
```

**Step 4: Verify fonts load**

Run: `cd /Users/bart/claude/together-map/mobile && npx expo start`
Expected: App loads without font loading errors.

**Step 5: Commit**

```bash
git add mobile/lib/theme.ts mobile/app/_layout.tsx mobile/package.json mobile/package-lock.json
git commit -m "feat: update mobile design tokens — new palette, fonts, animations for Type-Heavy Modernist redesign"
```

---

### Task 3: Create New Logo Component (Web + Mobile)

Replace the current ForkDot + Outfit text logo with the new design: solid circle with negative-space fork cutout + Inter Tight Bold wordmark.

**Files:**
- Modify: `src/components/logo.tsx`
- Modify: `mobile/components/ui/Logo.tsx`

**Step 1: Update web logo** (`src/components/logo.tsx`)

Replace with an SVG implementation using the fork mask technique from the prototype. The logo mark is a 20px dark circle with a fork cut out as negative space. The wordmark is "EefEats" in Inter Tight Bold (font-body font-bold), -0.03em tracking.

Key SVG structure:
```jsx
<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <mask id="fork-mask">
      <rect width="24" height="24" fill="white"/>
      <line x1="8.5" y1="5" x2="8.5" y2="10.5" stroke="black" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="10.8" y1="5" x2="10.8" y2="10.5" stroke="black" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="13.2" y1="5" x2="13.2" y2="10.5" stroke="black" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="15.5" y1="5" x2="15.5" y2="10.5" stroke="black" strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M8.5 10.5 Q8.5 13 12 13 Q15.5 13 15.5 10.5" stroke="black" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
      <line x1="12" y1="13" x2="12" y2="19.5" stroke="black" strokeWidth="1.8" strokeLinecap="round"/>
    </mask>
  </defs>
  <circle cx="12" cy="12" r="11" fill="currentColor" mask="url(#fork-mask)"/>
</svg>
```

**Step 2: Update mobile logo** (`mobile/components/ui/Logo.tsx`)

Use `react-native-svg` to render the same fork-in-circle mark. Match the web implementation exactly.

**Step 3: Verify both render**

Web: Start dev server, check logo in header.
Mobile: Check logo in tab bar / headers.

**Step 4: Commit**

```bash
git add src/components/logo.tsx mobile/components/ui/Logo.tsx
git commit -m "feat: new logo — circle with negative-space fork cutout + Inter Tight wordmark"
```

---

## Phase 2: Layout Shell

### Task 4: Redesign Web Authenticated Layout

Replace the current header and navigation with the new sticky, blurred nav bar from the prototype.

**Files:**
- Modify: `src/app/(authenticated)/layout.tsx`

**Design spec:**
- Sticky nav with `backdrop-filter: blur(20px)`, `rgba(246,244,239,0.92)` background
- Logo left, mono nav links (Feed, Browse) + avatar circle right
- Active link: underline with 4px offset, `#141210` color
- Nav links: Geist Mono, 11px, uppercase, 0.08em tracking, `#9C978C` default
- Avatar: 28px circle, `#141210` bg, `#F6F4EF` text, spring scale on hover
- 3px thick rule below nav
- No more horizontal scrolling tabs — simplified to Feed + Browse + avatar
- Footer: remove or simplify

**Key changes:**
- Replace tab-style horizontal nav with 2 text links + avatar
- Add sticky positioning with blur
- Replace "EefEats" Outfit logo with new logo mark + Inter Tight wordmark
- Change max-width from 3xl to `max-w-[480px]` for mobile-first editorial feel
- Body background from white to `bg` (#F6F4EF)
- Replace the footer text

**Step 1: Rewrite the authenticated layout**

Match the prototype nav structure: logo left, nav-right with links + avatar.

**Step 2: Verify navigation works**

Run: `npm run dev`
Expected: All existing routes still work. New nav displays correctly.

**Step 3: Commit**

```bash
git add src/app/(authenticated)/layout.tsx
git commit -m "feat: redesign web layout — sticky blurred nav, new logo, editorial max-width"
```

---

### Task 5: Redesign Mobile Tab Bar and Navigation

Update the tab bar appearance and screen headers to match the new design.

**Files:**
- Modify: `mobile/app/(tabs)/_layout.tsx`
- Modify: `mobile/app/_layout.tsx` (header defaults)

**Design spec:**
- Tab bar: blurred bg (`rgba(246,244,239,0.94)`), 1px border-top
- Tab labels: Geist Mono, 9px, uppercase, 0.06em tracking
- Tab icons: stroke style, `#9C978C` inactive, `#141210` active
- Active press: scale(0.88) spring bounce
- 5 tabs: Home, Discover, Recipes, Groceries, Profile

**Step 1: Update tab bar styling**

Use theme colors for background, border, active/inactive states. Update fonts to mono.

**Step 2: Update header defaults**

Use Inter Tight for header titles, `#F6F4EF` background.

**Step 3: Verify all tabs work**

Run: `npx expo start`
Expected: All tabs navigate correctly with new styling.

**Step 4: Commit**

```bash
git add mobile/app/(tabs)/_layout.tsx mobile/app/_layout.tsx
git commit -m "feat: redesign mobile tab bar — mono labels, warm bg, spring press animations"
```

---

## Phase 3: Core Screens

### Task 6: Redesign Web Home Page

Transform the home page into the editorial layout from the prototype: compact masthead, featured recipe, numbered recipe index, activity ticker.

**Files:**
- Modify: `src/app/(authenticated)/home/page.tsx`
- Modify: `src/app/(authenticated)/home/activity-feed.tsx`

**Design spec (from prototype):**

1. **Masthead** — single-line, italic serif greeting left, mono date right, thin border-bottom
2. **Double rule** — 3px top + 1px bottom with 3px gap
3. **Featured Recipe** — two-column grid (1fr + 130px image), mono category, large 28px serif title, light 13px excerpt, mono metadata
4. **Thin rule**
5. **Recipe Index** — numbered list with large serif ghost-colored numbers (accent on hover), serif 20px titles, 56px square thumbnails, mono meta, accent-light bg on hover
6. **Thin rule**
7. **Activity Ticker** — small 36px thumbnails, bold name + italic serif recipe-ref in accent, right-aligned mono timestamp, star ratings in accent color

**Key functional changes:**
- Keep the existing data fetching (activity feed RPC, favorites/recent query)
- Replace greeting from "Good morning/evening, Name" h1 to compact italic serif masthead
- Replace horizontal recipe carousel with the featured recipe section (first item)
- Replace list layout with numbered index (remaining items)
- Restyle activity feed items with small thumbnails and ticker layout

**Step 1: Rewrite home page layout structure**

Match the prototype sections: masthead → double rule → featured → thin rule → index → thin rule → activity ticker.

**Step 2: Update activity feed component**

Restyle each feed item to use the ticker layout: small thumb, bold name, italic serif recipe ref, mono timestamp.

**Step 3: Add staggered entry animations**

Use `animate-fade-in-up opacity-0` with sequential animation-delay classes.

**Step 4: Verify**

Run: `npm run dev`, navigate to /home.
Expected: Page matches prototype layout with real data.

**Step 5: Commit**

```bash
git add src/app/(authenticated)/home/page.tsx src/app/(authenticated)/home/activity-feed.tsx
git commit -m "feat: redesign web home — editorial masthead, featured recipe, numbered index, activity ticker"
```

---

### Task 7: Redesign Mobile Home Screen

Mirror the web home redesign on mobile.

**Files:**
- Modify: `mobile/app/(tabs)/index.tsx`

**Design spec:** Same as Task 6 but using React Native components:
- Masthead: `View` with `flexDirection: 'row'`, serif italic greeting, mono date
- Featured: two-column layout using `flexDirection: 'row'`
- Index: `FlatList` items with serif numbers, 56px thumbnails
- Activity: items with 36px thumbs, serif italic recipe names

**Step 1: Restructure the home screen**

Replace greeting, carousel, and activity sections with new editorial layout.

**Step 2: Add Reanimated entry animations**

Use `FadeInDown` with stagger delays from theme.

**Step 3: Verify**

Run: `npx expo start`
Expected: Home screen matches new design with real data.

**Step 4: Commit**

```bash
git add mobile/app/(tabs)/index.tsx
git commit -m "feat: redesign mobile home — editorial masthead, featured recipe, numbered index, activity ticker"
```

---

### Task 8: Redesign Web Recipe Detail Page

Transform the recipe detail into the editorial layout with parallax hero, stats bar, interactive ingredients, and numbered steps.

**Files:**
- Modify: `src/app/(authenticated)/recipes/[id]/recipe-detail.tsx`
- May modify subcomponents in same directory

**Design spec (from prototype):**

1. **Detail nav** — sticky blurred, mono "Back" with arrow left, mono "Share" + "Save" actions right
2. **Hero image** — 220px overflow hidden, zoom animation (1.08→1), gradient fade to bg at bottom
3. **Header** — mono category, 40px serif title, light byline "By Name · Cooked Nx", mono date
4. **Stats bar** — 3px top border + 1px bottom, 4 cells (Prep/Cook/Serves/Rating), serif values, mono labels, accent-light bg on hover
5. **Intro** — italic serif 18px, secondary color, max-width 360px
6. **Ingredients** — interactive checkboxes with spring pop animation, accent fill, strikethrough with accent color, mono amounts, dotted border between items
7. **Steps** — leading-zero numbers (01, 02), large serif number (28px, ghost→accent on hover), light body text, grid layout

**Key functional changes:**
- Keep all existing functionality (favorite, save, share, edit, delete, tags, cooking log, ratings, servings adjuster, unit toggle, collection picker)
- Wrap them in the new visual layout
- Add ingredient checkbox toggle (client-side only, visual feedback)
- Add hero zoom animation
- Restyle stats from badges to the stats bar pattern

**Step 1: Restructure the detail page layout**

Reorganize sections to match prototype order. Keep existing subcomponent imports.

**Step 2: Add interactive ingredient checkboxes**

Add client-side state for checked ingredients. On click: toggle checkbox, strikethrough name, fade amount.

**Step 3: Restyle step numbers**

Leading-zero format, large serif, ghost color with accent on hover.

**Step 4: Add hero parallax**

CSS-only: overflow hidden container, img with `animate-hero-zoom`, gradient overlay div at bottom.

**Step 5: Add stats bar**

3px/1px bordered bar with 4 flex cells.

**Step 6: Verify**

Navigate to a recipe detail page with data.
Expected: Layout matches prototype. All actions (save, share, edit, etc.) still work.

**Step 7: Commit**

```bash
git add src/app/(authenticated)/recipes/[id]/recipe-detail.tsx
git commit -m "feat: redesign web recipe detail — parallax hero, stats bar, interactive ingredients, editorial steps"
```

---

### Task 9: Redesign Mobile Recipe Detail Screen

Mirror the web recipe detail redesign on mobile.

**Files:**
- Modify: `mobile/app/recipe/[id]/index.tsx`

**Design spec:** Same as Task 8 but using React Native:
- Hero: `Animated.Image` with Reanimated zoom (scale 1.08→1)
- Stats bar: `View` with thick top border, thin bottom border
- Ingredients: `Pressable` list items with Reanimated check pop
- Steps: leading-zero numbers, grid layout

**Step 1: Restructure the detail screen**

Match new layout order. Keep existing functionality.

**Step 2: Add Reanimated hero zoom**

SharedValue for scale, animate from 1.08 to 1 on mount.

**Step 3: Add ingredient checkbox interaction**

State array for checked items, spring pop animation on toggle.

**Step 4: Verify**

Open a recipe detail screen.
Expected: Matches new design. All actions work.

**Step 5: Commit**

```bash
git add mobile/app/recipe/[id]/index.tsx
git commit -m "feat: redesign mobile recipe detail — parallax hero, stats bar, interactive ingredients"
```

---

### Task 10: Redesign Web Discover Page

Transform the discover page with editorial search, mono filter tabs, and index-style results.

**Files:**
- Modify: `src/app/(authenticated)/discover/page.tsx`
- Modify: `src/app/(authenticated)/discover/discover-controls.tsx`
- Modify: `src/app/(authenticated)/discover/chefs-tab.tsx`

**Design spec (from prototype):**

1. **Header** — mono overline "Explore", 32px serif title "Discover"
2. **Search** — bottom-border style: 2px ink border-bottom, accent on focus, no outline/bg, 15px light text, search icon left
3. **Filter tabs** — mono 11px uppercase, no borders/pills, active = ink color + 2px underline, inactive = muted
4. **Results** — same as recipe index: 56px thumbnails, serif 20px titles, mono category + meta, accent-light bg on hover, expand animation

**Key functional changes:**
- Keep existing search, sort, tag filter, and pagination
- Restyle controls from dropdowns/pills to underlined mono tabs
- Restyle result cards to index-item layout

**Step 1: Rewrite discover page layout**

New header with overline, serif title, bottom-border search.

**Step 2: Restyle filter/sort controls**

Replace pill buttons with mono underlined tabs.

**Step 3: Restyle result items**

Match the index-item pattern from the prototype.

**Step 4: Verify**

Navigate to /discover, search and filter.
Expected: Search works, results display in new style.

**Step 5: Commit**

```bash
git add src/app/(authenticated)/discover/page.tsx src/app/(authenticated)/discover/discover-controls.tsx src/app/(authenticated)/discover/chefs-tab.tsx
git commit -m "feat: redesign web discover — editorial search, mono tabs, index-style results"
```

---

### Task 11: Redesign Mobile Discover Screen

Mirror the web discover redesign on mobile.

**Files:**
- Modify: `mobile/app/(tabs)/discover.tsx`

**Step 1: Restructure discover screen**

Match new layout: overline, serif title, bottom-border search, mono tabs, index-style results.

**Step 2: Verify**

Search and filter on mobile.
Expected: Matches new design, all functionality works.

**Step 3: Commit**

```bash
git add mobile/app/(tabs)/discover.tsx
git commit -m "feat: redesign mobile discover — editorial search, mono tabs, index-style results"
```

---

### Task 12: Redesign Web Profile Page

Transform both own-profile and public profile into the editorial layout.

**Files:**
- Modify: `src/app/(authenticated)/profile/page.tsx`
- Modify: `src/app/(authenticated)/profile/[id]/page.tsx`
- Modify: `src/app/(authenticated)/profile/[id]/profile-tabs.tsx`

**Design spec (from prototype):**

1. **Top** — left-aligned: 64px avatar + serif 28px name + light 13px bio
2. **Stats bar** — same 3px/1px pattern as recipe detail (Recipes/Published/Cooked/Followers)
3. **Nav tabs** — mono 11px uppercase with active underline
4. **Recipe list** — 48px thumbnails, serif 17px titles, mono meta, border badges (Published/Private)

**Step 1: Rewrite profile layout**

New left-aligned header with avatar, serif name, bio.

**Step 2: Add stats bar**

Same bordered bar pattern as recipe detail.

**Step 3: Restyle recipe list**

48px thumbs, serif titles, border badges.

**Step 4: Verify**

Check own profile and a public profile.
Expected: Both display correctly.

**Step 5: Commit**

```bash
git add src/app/(authenticated)/profile/page.tsx src/app/(authenticated)/profile/[id]/page.tsx src/app/(authenticated)/profile/[id]/profile-tabs.tsx
git commit -m "feat: redesign web profile — editorial layout, stats bar, mono tabs"
```

---

### Task 13: Redesign Mobile Profile Screen

Mirror the web profile redesign on mobile.

**Files:**
- Modify: `mobile/app/(tabs)/profile.tsx`
- Modify: `mobile/app/profile/[id].tsx`

**Step 1: Restructure profile screens**

Match new layout for both own and public profiles.

**Step 2: Verify**

Check profile screens on mobile.
Expected: Matches new design.

**Step 3: Commit**

```bash
git add mobile/app/(tabs)/profile.tsx mobile/app/profile/[id].tsx
git commit -m "feat: redesign mobile profile — editorial layout, stats bar, mono tabs"
```

---

## Phase 4: Remaining Screens

### Task 14: Restyle Web My Recipes / Library Page

Update the recipes library page to use the new design language.

**Files:**
- Modify: `src/app/(authenticated)/recipes/page.tsx`
- Modify: `src/app/(authenticated)/recipes/recipe-list-controls.tsx`
- Modify: `src/app/(authenticated)/recipes/collections-section.tsx`

**Design spec:**
- Overline + serif title header
- Search: bottom-border style (matching discover)
- Sort/filter: mono tab style
- Recipe items: numbered index style or profile-recipe style (48-56px thumbs, serif titles)
- Collections: serif section names, mono count
- Border badges for Published/Private

**Step 1: Restyle page header, search, filters**

Match discover's editorial pattern.

**Step 2: Restyle recipe list items**

Use index-item or profile-recipe pattern.

**Step 3: Restyle collections section**

Serif names, mono counts, warm borders.

**Step 4: Verify and commit**

```bash
git add src/app/(authenticated)/recipes/page.tsx src/app/(authenticated)/recipes/recipe-list-controls.tsx src/app/(authenticated)/recipes/collections-section.tsx
git commit -m "feat: restyle web my recipes — editorial search, index-style items"
```

---

### Task 15: Restyle Mobile My Recipes Screen

**Files:**
- Modify: `mobile/app/(tabs)/recipes.tsx`

**Step 1: Match web restyling**

Apply same patterns: bottom-border search, mono tabs, serif titles, small thumbnails.

**Step 2: Verify and commit**

```bash
git add mobile/app/(tabs)/recipes.tsx
git commit -m "feat: restyle mobile my recipes — editorial search, index-style items"
```

---

### Task 16: Restyle Grocery List (Web + Mobile)

**Files:**
- Modify: `src/app/(authenticated)/shopping-list/page.tsx` and subcomponents
- Modify: `mobile/app/(tabs)/shopping-list.tsx`

**Design spec:**
- Serif section title
- Interactive checkboxes (same style as recipe detail ingredients)
- Mono metadata for quantities
- Border-based layout, no card shadows

**Step 1: Restyle web grocery list**
**Step 2: Restyle mobile grocery list**
**Step 3: Verify and commit**

```bash
git add src/app/(authenticated)/shopping-list/ mobile/app/(tabs)/shopping-list.tsx
git commit -m "feat: restyle grocery list — editorial checkboxes, mono metadata"
```

---

### Task 17: Restyle Supporting Pages (Web + Mobile)

Update all remaining pages to use the new design language. These pages get lighter treatment — mainly color/font updates.

**Files (web):**
- `src/app/login/page.tsx`
- `src/app/signup/signup-form.tsx`
- `src/app/onboarding/onboarding-form.tsx`
- `src/app/(authenticated)/invites/page.tsx`
- `src/app/(authenticated)/profile/edit/page.tsx`
- `src/app/(authenticated)/profile/edit/profile-form.tsx`
- `src/app/(authenticated)/profile/requests/page.tsx`
- `src/app/(authenticated)/profile/new-followers/page.tsx`
- `src/app/r/[id]/page.tsx` (public recipe share)
- `src/app/(authenticated)/admin/**` (admin pages)

**Files (mobile):**
- `mobile/app/(auth)/login.tsx`
- `mobile/app/(auth)/signup.tsx`
- `mobile/app/onboarding.tsx`
- `mobile/app/invites.tsx`
- `mobile/app/profile/edit.tsx`
- `mobile/app/profile/requests.tsx`
- `mobile/app/profile/new-followers.tsx`
- `mobile/app/recipe/new.tsx`
- `mobile/app/recipe/import-url.tsx`
- `mobile/app/recipe/import-photo.tsx`
- `mobile/app/recipe/import-instagram.tsx`
- `mobile/app/recipe/[id]/edit.tsx`

**Design changes:**
- Background: warm cream (#F6F4EF)
- Text: ink colors from theme
- Buttons: accent (#8B4513) CTAs, mono labels
- Inputs: bottom-border style or warm border
- All fonts: Inter Tight body, Instrument Serif for titles, Geist Mono for labels

**Step 1: Update web supporting pages**

Batch-update colors, fonts, button styles across all listed files.

**Step 2: Update mobile supporting pages**

Same treatment — theme colors, font families.

**Step 3: Verify each page renders**

Quick check of login, signup, onboarding, edit profile, import flows.

**Step 4: Commit**

```bash
git add src/app/ mobile/app/
git commit -m "feat: restyle supporting pages — warm palette, editorial typography across all screens"
```

---

## Phase 5: Polish and Review

### Task 18: Update Shared Components (Web + Mobile)

Update any remaining shared components that still reference old design tokens.

**Files (web):**
- `src/components/feedback-modal.tsx`
- `src/app/(authenticated)/components/recommendation-card.tsx`

**Files (mobile):**
- `mobile/components/ui/Button.tsx`
- `mobile/components/ui/Card.tsx`
- `mobile/components/ui/AnimatedCard.tsx`
- `mobile/components/ui/RecipeCard.tsx`
- `mobile/components/ui/ChefCard.tsx`
- `mobile/components/ui/Badge.tsx`
- `mobile/components/ui/StarRating.tsx`
- `mobile/components/ui/Avatar.tsx`
- `mobile/components/ui/SectionHeader.tsx`
- `mobile/components/ui/EmptyState.tsx`
- `mobile/components/ui/Skeleton.tsx`
- `mobile/components/skeletons/` (all skeleton files)
- `mobile/components/FeedbackModal.tsx`

**Design changes:**
- Badge: border style (mono, 9px, uppercase, outlined), Published=olive, Private=muted
- StarRating: use accent color (#8B4513) for filled stars
- RecipeCard: serif title, mono meta, no rounded corners on images
- Button: accent bg for primary, warm surface for secondary
- Avatar: ink bg, bg text color
- Empty states: serif titles, light body, accent CTA

**Step 1: Update each component to use new theme tokens**
**Step 2: Verify components render correctly in context**
**Step 3: Commit**

```bash
git add src/components/ mobile/components/
git commit -m "feat: update shared components — new palette, serif titles, mono labels, border badges"
```

---

### Task 19: Cross-Platform Visual Review

Use the ui-reviewer and platform-sync agents to verify consistency.

**Step 1: Run platform-sync agent**

Verify feature parity between web and mobile after redesign.

**Step 2: Run ui-reviewer agent**

Check all screens for visual consistency with the design spec.

**Step 3: Fix any issues found**

Address mismatched colors, fonts, spacing, or missing animations.

**Step 4: Update `docs/PLATFORM-PARITY.md`**

Note the redesign completion.

**Step 5: Final commit**

```bash
git add .
git commit -m "fix: visual consistency polish across web and mobile after redesign"
```

---

### Task 20: Clean Up Old Design Tokens

Remove any remaining references to old colors/fonts that are no longer used.

**Step 1: Search for old hex values**

Grep for `#2D5F5D`, `#234B49`, `#3D7A72`, `#666666`, `#E8E8E8`, `#F5F5F5`, `DM Sans`, `Outfit` across all source files.

**Step 2: Replace any remaining hardcoded values with theme tokens**

**Step 3: Remove backward-compat aliases from theme if no longer referenced**

**Step 4: Verify build**

```bash
npm run build  # web
cd mobile && npx expo start  # mobile
```

**Step 5: Commit**

```bash
git add .
git commit -m "chore: remove old design tokens and hardcoded color references"
```

---

## Implementation Notes

### Font Loading Verification

After Tasks 1-2, verify fonts actually load:
- **Web:** Open DevTools → Elements → check computed font-family on body, headings, and metadata
- **Mobile:** Geist Mono may need `expo prebuild` if it doesn't load from Google Fonts directly

### Image Styling

Key change: **No rounded corners on images.** Remove all `rounded-*` classes from recipe images, thumbnails, and hero images. Images should be square/rectangular.

Exception: Avatars keep `rounded-full`.

### Color Migration Strategy

The plan uses backward-compat aliases (`warm.*`, `cta.*`, `primary*`) so existing code doesn't break immediately. Tasks 14-18 progressively replace old token usage. Task 20 cleans up aliases.

### Animation Performance

- Web: CSS-only animations, no JS animation libraries needed
- Mobile: Reanimated runs on UI thread — no performance concerns for spring animations
- Keep stagger max at 10 items to avoid long initial load animations

### What NOT to Change

- No data model changes
- No API/RPC changes
- No routing changes
- No new pages or features
- All existing functionality must continue to work
- Admin pages get minimal treatment (colors/fonts only)
