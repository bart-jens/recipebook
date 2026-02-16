# EefEats Platform Parity Report

**Generated:** 2026-02-15
**Web:** Next.js 14 (App Router) + Tailwind CSS
**Mobile:** React Native / Expo (Expo Router)
**Backend:** Shared Supabase (PostgreSQL + RLS)

---

## Executive Summary

Both platforms share ~90% feature parity. Core functionality (CRUD, imports, discovery, social features) is present on both. The main gaps are minor and documented below.

---

## 1. Authentication & Onboarding

| Feature | Web | Mobile | Status |
|---------|-----|--------|--------|
| Login (email/password) | Yes | Yes | MATCH |
| Signup with invite code | Yes | Yes | MATCH |
| Session persistence | Yes | Yes | MATCH |
| Sign out | Yes | Yes | MATCH |

---

## 2. Recipe CRUD

| Feature | Web | Mobile | Status |
|---------|-----|--------|--------|
| Create new recipe (manual) | Yes | Yes | MATCH |
| Edit recipe | Yes | Yes | MATCH |
| Delete recipe | Yes | Yes | MATCH |
| Add/remove ingredients | Yes | Yes | MATCH |
| Add/remove tags | Yes | Yes | MATCH |
| Mark as favorite | Yes | Yes | MATCH (mobile has animation) |

---

## 3. Recipe Import

| Feature | Web | Mobile | Status |
|---------|-----|--------|--------|
| Import from URL | Yes | Yes | MATCH |
| Import from Instagram | Yes (standalone page) | Yes (auto-detect in URL import) | PARTIAL |
| Import from photo (OCR) | Yes | Yes | MATCH |
| Review before save | Yes | Yes | MATCH |

---

## 4. Recipe List

| Feature | Web | Mobile | Status |
|---------|-----|--------|--------|
| List all user recipes | Yes | Yes | MATCH |
| Search by title | Yes | Yes | MATCH |
| Sort (Recent, A-Z, Rating, Prep, Cook) | Yes | Yes | MATCH |
| Filter by course | Yes | Yes | MATCH |
| Filter by tag | Yes | Yes | MATCH |
| Display favorites first | Yes | Yes | MATCH |
| Empty state | Yes | Yes | MATCH |

---

## 5. Recipe Detail

| Feature | Web | Mobile | Status |
|---------|-----|--------|--------|
| Full recipe display | Yes | Yes | MATCH |
| Servings adjuster (scaling) | Yes | Yes | MATCH |
| Unit conversion (metric/imperial) | Yes | Yes | MATCH |
| Tags display | Yes | Yes | MATCH |
| Source attribution | Yes | Yes | MATCH |
| Creator name (public recipes) | Yes | Yes | MATCH |
| Favorite button | Yes | Yes | MATCH |
| Edit / Delete (owner) | Yes | Yes | MATCH |
| Publish / Unpublish (owner) | Yes | Yes | MATCH |
| Fork button (public, non-owner) | Yes | Yes | MATCH |
| Photo carousel | Yes | Yes | MATCH |
| Parallax hero image | No | Yes | MOBILE-ONLY |
| Celebration overlay | No | Yes | MOBILE-ONLY |
| Cooking log | Yes | Yes | MATCH |
| Aggregate rating (public) | Yes | Yes | MATCH |

---

## 6. Discover / Browse Public Recipes

| Feature | Web | Mobile | Status |
|---------|-----|--------|--------|
| List public recipes | Yes | Yes | MATCH |
| Search by title | Yes | Yes | MATCH |
| Sort (Newest, Top Rated, Most Forked) | Yes | Yes | MATCH |
| Filter by tag | Yes | Yes | MATCH |
| Creator name on cards | Yes | Yes | MATCH |
| Rating + fork count on cards | Yes | Yes | MATCH |
| Pagination | Yes (Load More) | Yes (infinite scroll) | PARTIAL |
| Pull to refresh | No | Yes | MOBILE-ONLY |

---

## 7. User Profiles

| Feature | Web | Mobile | Status |
|---------|-----|--------|--------|
| Display name, avatar, bio | Yes | Yes | MATCH |
| Stats (recipes, followers, following) | Yes | Yes | MATCH |
| Private account toggle | Yes | Yes | MATCH |
| Edit profile | Yes | Yes | MATCH |
| Avatar upload | Yes | Yes | MATCH |
| Plan badge (free/premium) | Yes | Yes | MATCH |
| User's recent recipes on profile | Yes | Yes | MATCH |
| Creator badge | Yes | Yes | MATCH |

---

## 8. Public Profiles (Other Users)

| Feature | Web | Mobile | Status |
|---------|-----|--------|--------|
| Display profile info | Yes | Yes | MATCH |
| Follow / Unfollow | Yes | Yes | MATCH |
| Request to Follow (private) | Yes | Yes | MATCH |
| "Requested" state | Yes | Yes | MATCH |
| Published recipes (if allowed) | Yes | Yes | MATCH |
| Recommendations (share cards) | Yes | Yes | MATCH |
| Private account gating | Yes | Yes | MATCH |

---

## 9. Follow System

| Feature | Web | Mobile | Status |
|---------|-----|--------|--------|
| Follow public user | Yes | Yes | MATCH |
| Request to follow private user | Yes | Yes | MATCH |
| Unfollow | Yes | Yes | MATCH |
| Cancel pending request | Yes | Yes | MATCH |
| View follow requests | Yes | Yes | MATCH |
| Approve / Deny requests | Yes | Yes | MATCH |
| Requests indicator badge | Yes | Yes | MATCH |

---

## 10. Invite Management

| Feature | Web | Mobile | Status |
|---------|-----|--------|--------|
| Create invite | Yes | Yes | MATCH |
| View invite list | Yes | Yes | MATCH |
| Display status (Pending/Joined) | Yes | Yes | MATCH |
| Show invite limit | Yes | Yes | MATCH |
| Native share | No | Yes | MOBILE-ONLY |

---

## 11. Home Dashboard

| Feature | Web | Mobile | Status |
|---------|-----|--------|--------|
| Greeting with time of day | Yes | Yes | MATCH |
| Stats summary | Yes | Yes | MATCH |
| Recently updated recipes | Yes | Yes | MATCH |
| Friend recommendations | Yes | Yes | MATCH |
| Discover / trending section | Yes | Yes | MATCH |
| Friend activity feed | Yes | Yes | MATCH |

---

## 12. Recipe Images

| Feature | Web | Mobile | Status |
|---------|-----|--------|--------|
| Upload recipe image | Yes | Yes | MATCH |
| Replace image | Yes | Yes | MATCH |
| Photo carousel | Yes | Yes | MATCH |
| Image rehosting | Yes | Yes | MATCH |

---

## 13. Navigation

| Feature | Web | Mobile | Status |
|---------|-----|--------|--------|
| Top navigation bar | Yes | No | WEB-ONLY (web pattern) |
| Bottom tab navigation | No | Yes | MOBILE-ONLY (mobile pattern) |
| Access to all sections | Yes | Yes | MATCH |

---

## Prioritized Gaps

### Resolved (2026-02-16)

All high and medium priority gaps have been addressed:

- Mobile signup flow with invite code
- Unit conversion toggle on mobile recipe detail
- Tag filtering on mobile recipe list
- Friend activity feed on web home dashboard
- Stats summary on mobile home screen
- Plan badge on web profile
- Creator badge on mobile profile
- Recent recipes on mobile own profile

### Low Priority (UX polish)

| Gap | Platform | Action |
|-----|----------|--------|
| Celebration animations | Web | Subtle confetti/toast on first cook/publish |
| Native share for invites | Web | Web Share API for invite codes |
| Centralized TypeScript types | Both | Shared types package |

---

## Data Model Consistency: MATCH

Both platforms query the same Supabase tables with identical column names and types. RLS policies apply equally. No data model divergence.
