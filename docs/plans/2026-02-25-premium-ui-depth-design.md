# Premium UI — Depth & Polish Design

**Date:** 2026-02-25
**Scope:** Home screen + Recipe detail (phase 1: home only)
**Goal:** Add depth and polish to the mobile app through an elevation system and card-based UI

---

## Approach

Theme-first: add shadow tokens and image radius to `theme.ts`, then apply consistently.
No new components — existing StyleSheet patterns updated.

---

## Theme additions (`mobile/lib/theme.ts`)

Replace the dead `shadows` export (all zeros) with three elevation levels:

```ts
shadows.card    — 1pt lift, 6% opacity  (carousel cards, ticker items)
shadows.medium  — 2pt lift, 9% opacity  (modals, bottom sheets)
shadows.strong  — 4pt lift, 13% opacity (overlays, action sheets)
```

Add `radii.image = 8` — distinct token for recipe/avatar images.

---

## Home screen changes (`mobile/app/(tabs)/index.tsx`)

**Carousel cards:**
- `carouselCard`: white background + `shadows.card`
- `carouselImage`: `borderRadius: radii.image` (was 0)
- `carouselCardBody`: add `paddingHorizontal: 8, paddingBottom: 8`

**Ticker items:**
- Remove top border divider
- Add: white background, `borderRadius: radii.sm`, `shadows.card`,
  `marginHorizontal: pagePadding`, `marginBottom: spacing.sm`
- Move inner padding inside the card

---

## Recipe detail (planned, not yet designed)

Follow-up: ingredient section card, instructions card, hero gradient treatment.
