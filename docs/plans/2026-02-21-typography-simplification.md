# Typography Simplification — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the 3-font, 17-size, 11-spacing typography system with a single-font "Warm Minimal" type scale: Inter Tight only, 8 sizes, 2 weights, no uppercase.

**Architecture:** Update theme/config files first (source of truth), then sweep all components screen-by-screen. Web and mobile updated together per task for platform parity.

**Tech Stack:** Next.js (Tailwind CSS), React Native/Expo (StyleSheet + theme.ts), Inter Tight font family

**Design doc:** `docs/plans/2026-02-21-typography-simplification-design.md`
**Visual preview:** `docs/design-preview/typo-b-warm-minimal.html`

---

## Reference: Type Scale

Every font usage must map to one of these 8 tokens:

| Token | Size | Weight | Tracking | Web classes | Mobile style |
|-------|------|--------|----------|-------------|--------------|
| title | 36px | 300 | -0.03em | `text-[36px] font-light tracking-[-0.03em]` | `typography.title` |
| heading | 26px | 400 | -0.01em | `text-[26px] font-normal tracking-[-0.01em]` | `typography.heading` |
| subheading | 20px | 400 | 0 | `text-[20px] font-normal` | `typography.subheading` |
| body | 15px | 300 | 0 | `text-[15px] font-light` | `typography.body` |
| bodySmall | 13px | 300 | 0 | `text-[13px] font-light` | `typography.bodySmall` |
| label | 14px | 400 | 0 | `text-[14px] font-normal` | `typography.label` |
| meta | 12px | 400 | +0.02em | `text-[12px] font-normal tracking-[0.02em]` | `typography.meta` |
| metaSmall | 11px | 400 | +0.02em | `text-[11px] font-normal tracking-[0.02em]` | `typography.metaSmall` |

**Mapping old sizes to new tokens:**
- 9-10px → metaSmall (11px)
- 11px → metaSmall (11px)
- 12px → meta (12px)
- 13px → bodySmall (13px)
- 14px → label (14px)
- 15px → body (15px)
- 17-18px → subheading (20px)
- 20px → subheading (20px)
- 22-24px → heading (26px)
- 28-32px → title (36px)
- 36-40px → title (36px)

**Mapping old font-family + weight combos:**
- `font-display` (Instrument Serif) → `font-normal` or `font-light` (depends on token)
- `font-mono` (Geist Mono) → `font-normal` (meta/metaSmall tokens)
- `font-body font-bold/semibold/medium` → `font-normal` (400 max)
- `uppercase` → remove entirely
- `tracking-[0.06-0.14em]` → `tracking-[0.02em]` (only on meta tokens)
- `tracking-[-0.01 to -0.04em]` → `tracking-[-0.03em]` (title) or `tracking-[-0.01em]` (heading)

---

## Task 1: Update web config files

**Files:**
- Modify: `tailwind.config.ts` (lines 10-17)
- Modify: `src/app/globals.css` (lines 1, 28-38)

**Step 1: Update tailwind.config.ts**

Replace the fontFamily block:

```typescript
fontFamily: {
  body: ["Inter Tight", "system-ui", "sans-serif"],
  sans: ["Inter Tight", "system-ui", "sans-serif"],
  logo: ["Inter Tight", "system-ui", "sans-serif"],
},
```

Remove `display` and `mono` keys entirely.

**Step 2: Update globals.css**

Replace the Google Fonts import (line 1) with:

```css
@import url('https://fonts.googleapis.com/css2?family=Inter+Tight:ital,wght@0,300;0,400;1,300;1,400&display=swap');
```

Remove the `.mono-label`, `.mono-meta`, and `.serif-title` component classes (lines 28-38).

**Step 3: Verify build compiles**

Run: `npx tsc --noEmit --project tsconfig.json`

The build will have errors in files that still reference `font-display` and `font-mono` — that's expected. But the config itself should be valid.

**Step 4: Commit**

```
git add tailwind.config.ts src/app/globals.css
git commit -m "chore: remove serif and mono fonts from web config"
```

---

## Task 2: Update mobile config files

**Files:**
- Modify: `mobile/lib/theme.ts` (lines 67-100)
- Modify: `mobile/app/_layout.tsx` (lines 3-42, 63)

**Step 1: Update theme.ts fontFamily**

Replace the entire `fontFamily` object:

```typescript
export const fontFamily = {
  sans: 'InterTight_400Regular',
  sansLight: 'InterTight_300Light',
  logo: 'InterTight_400Regular',
  system: Platform.OS === 'ios' ? 'System' : 'Roboto',
  // Backward compat aliases — all point to sans now
  display: 'InterTight_400Regular',
  displayItalic: 'InterTight_400Regular',
  mono: 'InterTight_400Regular',
  monoMedium: 'InterTight_400Regular',
  sansMedium: 'InterTight_400Regular',
  sansBold: 'InterTight_400Regular',
  serif: 'InterTight_400Regular',
  serifSemiBold: 'InterTight_400Regular',
  serifBold: 'InterTight_400Regular',
} as const;
```

Note: we keep backward compat aliases pointing to sans so existing inline references don't crash. They'll be cleaned up screen-by-screen.

**Step 2: Update theme.ts typography presets**

Replace the entire `typography` object:

```typescript
export const typography: Record<string, TextStyle> = {
  title: { fontSize: 36, fontFamily: fontFamily.sansLight, lineHeight: 40, letterSpacing: -0.03 * 36 },
  heading: { fontSize: 26, fontFamily: fontFamily.sans, lineHeight: 31, letterSpacing: -0.01 * 26 },
  subheading: { fontSize: 20, fontFamily: fontFamily.sans, lineHeight: 26 },
  body: { fontSize: 15, fontFamily: fontFamily.sansLight, lineHeight: 24 },
  bodySmall: { fontSize: 13, fontFamily: fontFamily.sansLight, lineHeight: 19 },
  label: { fontSize: 14, fontFamily: fontFamily.sans, lineHeight: 20 },
  meta: { fontSize: 12, fontFamily: fontFamily.sans, lineHeight: 16, letterSpacing: 0.02 * 12 },
  metaSmall: { fontSize: 11, fontFamily: fontFamily.sans, lineHeight: 15, letterSpacing: 0.02 * 11 },
  // Backward compat aliases — map old names to new tokens
  display: { fontSize: 36, fontFamily: fontFamily.sansLight, lineHeight: 40, letterSpacing: -0.03 * 36 },
  displaySmall: { fontSize: 26, fontFamily: fontFamily.sans, lineHeight: 31, letterSpacing: -0.01 * 26 },
  sectionTitle: { fontSize: 20, fontFamily: fontFamily.sans, lineHeight: 26 },
  h1: { fontSize: 36, fontFamily: fontFamily.sansLight, lineHeight: 40, letterSpacing: -0.03 * 36 },
  h2: { fontSize: 26, fontFamily: fontFamily.sans, lineHeight: 31, letterSpacing: -0.01 * 26 },
  h3: { fontSize: 20, fontFamily: fontFamily.sans, lineHeight: 26 },
  bodyLight: { fontSize: 13, fontFamily: fontFamily.sansLight, lineHeight: 19 },
  caption: { fontSize: 12, fontFamily: fontFamily.sans, lineHeight: 16, letterSpacing: 0.02 * 12 },
  monoLabel: { fontSize: 11, fontFamily: fontFamily.sans, lineHeight: 15, letterSpacing: 0.02 * 11 },
  monoMeta: { fontSize: 12, fontFamily: fontFamily.sans, lineHeight: 16, letterSpacing: 0.02 * 12 },
  headingSmall: { fontSize: 20, fontFamily: fontFamily.sans, lineHeight: 26 },
} as const;
```

**Step 3: Update _layout.tsx font loading**

Remove Instrument Serif and Geist Mono imports and useFonts entries. Remove unused Inter Tight weights (500, 600, 700):

```typescript
import {
  InterTight_300Light,
  InterTight_400Regular,
} from '@expo-google-fonts/inter-tight';
```

Remove the InstrumentSerif and GeistMono import blocks entirely (lines 3-6 and 14-17).

Update the `useFonts` call:

```typescript
const [loaded, error] = useFonts({
  SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  ...FontAwesome.font,
  InterTight_300Light,
  InterTight_400Regular,
});
```

Update `headerTitleStyle` (around line 63) — replace `fontFamily.display` with `fontFamily.sans`.

**Step 4: Verify mobile app loads**

Run: `npx expo start` and confirm no font loading crashes.

**Step 5: Commit**

```
git add mobile/lib/theme.ts mobile/app/_layout.tsx
git commit -m "chore: remove serif and mono fonts from mobile config"
```

---

## Task 3: Web — Home page

**Files:**
- Modify: `src/app/(authenticated)/home/page.tsx`
- Modify: `src/app/(authenticated)/home/activity-feed.tsx`

**Changes:**
- Remove the greeting masthead ("Good morning, [Name]") and date display
- Replace all `font-display` → appropriate weight class (`font-light` for titles, `font-normal` for headings)
- Replace all `font-mono` → `font-normal` with meta/metaSmall sizing
- Remove all `uppercase` classes
- Remove all `tracking-[*]` except approved values (-0.03em, -0.01em, 0.02em)
- Consolidate font sizes to the 8-token scale

**Commit:** `feat: apply warm minimal typography to web home page`

---

## Task 4: Mobile — Home tab

**Files:**
- Modify: `mobile/app/(tabs)/index.tsx`

**Changes:**
- Remove the greeting masthead
- Replace all inline `fontFamily.display` → `fontFamily.sans` or `fontFamily.sansLight`
- Replace all inline `fontFamily.mono` → `fontFamily.sans`
- Remove all `textTransform: 'uppercase'`
- Consolidate all `letterSpacing` to approved values or remove
- Consolidate all `fontSize` to the 8-token scale
- Use `typography.*` presets wherever possible instead of inline styles

**Commit:** `feat: apply warm minimal typography to mobile home tab`

---

## Task 5: Web — Recipe detail + cooking log

**Files:**
- Modify: `src/app/(authenticated)/recipes/[id]/page.tsx`
- Modify: `src/app/(authenticated)/recipes/[id]/recipe-detail.tsx`
- Modify: `src/app/(authenticated)/recipes/[id]/cooking-log.tsx`

**Changes:** Same pattern — replace font-display/mono, remove uppercase/tracking, consolidate sizes.

These are the highest-frequency files (29+ font references in recipe-detail alone).

**Commit:** `feat: apply warm minimal typography to web recipe detail`

---

## Task 6: Mobile — Recipe detail

**Files:**
- Modify: `mobile/app/recipe/[id]/index.tsx`

This is the largest mobile file (1,969 lines, 39 fontSize references). Same changes as above.

**Commit:** `feat: apply warm minimal typography to mobile recipe detail`

---

## Task 7: Web — Recipes list + collections

**Files:**
- Modify: `src/app/(authenticated)/recipes/page.tsx`
- Modify: `src/app/(authenticated)/recipes/collections-section.tsx`
- Modify: `src/app/(authenticated)/recipes/recipe-list-controls.tsx`

**Commit:** `feat: apply warm minimal typography to web recipes list`

---

## Task 8: Mobile — Recipes tab + collections

**Files:**
- Modify: `mobile/app/(tabs)/recipes.tsx`
- Modify: `mobile/components/ui/CollectionsSection.tsx`
- Modify: `mobile/components/ui/RecipeCard.tsx`

**Commit:** `feat: apply warm minimal typography to mobile recipes tab`

---

## Task 9: Web — Profile pages

**Files:**
- Modify: `src/app/(authenticated)/profile/page.tsx`
- Modify: `src/app/(authenticated)/profile/[id]/page.tsx`
- Modify: `src/app/(authenticated)/profile/[id]/profile-tabs.tsx`
- Modify: `src/app/(authenticated)/profile/followers/page.tsx`

**Commit:** `feat: apply warm minimal typography to web profile pages`

---

## Task 10: Mobile — Profile screens

**Files:**
- Modify: `mobile/app/(tabs)/profile.tsx`
- Modify: `mobile/app/profile/[id].tsx`
- Modify: `mobile/app/profile/edit.tsx`
- Modify: `mobile/app/profile/new-followers.tsx`
- Modify: `mobile/app/profile/requests.tsx`

**Commit:** `feat: apply warm minimal typography to mobile profile screens`

---

## Task 11: Web — Discover + chefs

**Files:**
- Modify: `src/app/(authenticated)/discover/page.tsx`
- Modify: `src/app/(authenticated)/discover/chefs-tab.tsx`
- Modify: `src/app/(authenticated)/discover/chef-card.tsx`
- Modify: `src/app/(authenticated)/discover/discover-controls.tsx`
- Modify: `src/app/(authenticated)/discover/discover-save-button.tsx`
- Modify: `src/app/(authenticated)/discover/load-more.tsx`

**Commit:** `feat: apply warm minimal typography to web discover page`

---

## Task 12: Mobile — Discover tab + chef components

**Files:**
- Modify: `mobile/app/(tabs)/discover.tsx`
- Modify: `mobile/components/ui/ChefCard.tsx`

**Commit:** `feat: apply warm minimal typography to mobile discover tab`

---

## Task 13: Web — Shopping list

**Files:**
- Modify: `src/app/(authenticated)/shopping-list/shopping-list-view.tsx`

**Commit:** `feat: apply warm minimal typography to web shopping list`

---

## Task 14: Mobile — Shopping list

**Files:**
- Modify: `mobile/app/(tabs)/shopping-list.tsx`

**Commit:** `feat: apply warm minimal typography to mobile shopping list`

---

## Task 15: Web — Remaining pages (admin, invites, onboarding, public)

**Files:**
- Modify: `src/app/(authenticated)/admin/page.tsx`
- Modify: `src/app/(authenticated)/admin/users/user-list.tsx`
- Modify: `src/app/(authenticated)/admin/invites/invite-list.tsx`
- Modify: `src/app/(authenticated)/invites/page.tsx`
- Modify: `src/app/onboarding/page.tsx`
- Modify: `src/app/onboarding/onboarding-form.tsx`
- Modify: `src/app/r/[id]/page.tsx` (public recipe share page)
- Modify: `src/components/feedback-modal.tsx`
- Any other files still referencing font-display, font-mono, or uppercase

**Commit:** `feat: apply warm minimal typography to remaining web pages`

---

## Task 16: Mobile — Remaining screens (auth, onboarding, shared components)

**Files:**
- Modify: `mobile/app/(auth)/login.tsx`
- Modify: `mobile/app/(auth)/signup.tsx`
- Modify: `mobile/app/onboarding.tsx`
- Modify: `mobile/app/invites.tsx`
- Modify: `mobile/app/(tabs)/_layout.tsx` (tab bar labels)
- Modify: `mobile/components/FeedbackModal.tsx`
- Modify: `mobile/components/ui/Avatar.tsx`
- Modify: `mobile/components/ui/EmptyState.tsx`
- Modify: `mobile/components/ui/Badge.tsx`
- Modify: `mobile/components/ui/Button.tsx`
- Modify: `mobile/components/RecipeForm.tsx`
- Any other files still referencing display/mono fonts or uppercase

**Commit:** `feat: apply warm minimal typography to remaining mobile screens`

---

## Task 17: Final sweep and verification

**Step 1: Search for any remaining old patterns on web**

```bash
grep -r "font-display\|font-mono\|uppercase\|tracking-\[0\.0[4-9]\|tracking-\[0\.1" src/ --include="*.tsx" --include="*.ts" -l
```

Should return zero files.

**Step 2: Search for any remaining old patterns on mobile**

```bash
grep -r "fontFamily\.display\|fontFamily\.mono\|fontFamily\.serif\|textTransform.*uppercase" mobile/ --include="*.tsx" --include="*.ts" -l
```

Should return only `theme.ts` (backward compat aliases).

**Step 3: Type-check both platforms**

```bash
npx tsc --noEmit --project tsconfig.json
cd mobile && npx tsc --noEmit
```

**Step 4: Visual review**

Open every major screen on web and verify typography matches the preview. Check mobile in Expo Go.

**Step 5: Commit**

```
git commit -m "chore: final typography sweep — verify no old patterns remain"
```

---

## Task 18: Clean up backward compat aliases

Once all screens are migrated and verified:

**Step 1:** Remove backward compat aliases from `mobile/lib/theme.ts` fontFamily (display, mono, serif, etc.)

**Step 2:** Remove backward compat aliases from `mobile/lib/theme.ts` typography (display, h1, h2, monoLabel, etc.)

**Step 3:** Update all remaining references in mobile components to use only the 8 canonical token names.

**Step 4:** Remove unused font packages:

```bash
cd mobile && npm uninstall @expo-google-fonts/instrument-serif @expo-google-fonts/geist-mono
```

**Commit:** `chore: remove backward compat font aliases and unused font packages`
