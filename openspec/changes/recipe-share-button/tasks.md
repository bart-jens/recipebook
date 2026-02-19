## 1. Public Recipe Page

- [x] 1.1 Add `/r/` to middleware whitelist (unauthenticated access)
- [x] 1.2 Create `src/app/r/[id]/page.tsx` — public read-only recipe page with `generateMetadata()` for OG tags
- [x] 1.3 Handle private/missing recipes — show "This recipe is private" or "Recipe not found" with sign-up CTA

## 2. Share Button — Web

- [x] 2.1 Add share-link icon button on recipe detail page (web) — uses Web Share API with clipboard fallback

## 3. Share Button — Mobile

- [x] 3.1 Add share-link icon button on recipe detail screen (mobile) — uses React Native Share API
