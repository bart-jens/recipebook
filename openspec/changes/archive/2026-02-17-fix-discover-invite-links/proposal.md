## Why

On the Discover Chefs tab, several places mention inviting friends to EefEats but only one state (the "you follow all chefs" card) actually links to the invites page. The empty state and the bottom invite card are just static text — missed opportunity to drive invites.

## What Changes

- **Empty state** (0 chefs exist) — "Invite friends to join EefEats!" becomes a tappable link to the invites page
- **Bottom invite card** (when unfollowed chefs are shown) — "Know someone who loves cooking? Invite them to join EefEats" becomes a tappable card linking to invites
- Both web and mobile get the same fix

## Impact

**Frontend (Web):** `src/app/(authenticated)/discover/chefs-tab.tsx`
- Line 135: Wrap "Invite friends to join EefEats!" in a `<Link href="/invite">`
- Lines 211-216: Wrap the bottom invite card in a `<Link href="/invite">`

**Frontend (Mobile):** `mobile/app/(tabs)/discover.tsx`
- Line 371: Add `onPress` to EmptyState or wrap subtitle in a link to `/invites`
- Lines 478-481: Wrap the invite card in a `<Link href="/invites">` or add `onPress` with `router.push`

**No backend changes needed.**
