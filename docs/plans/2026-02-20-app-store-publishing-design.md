# App Store Publishing Design — EefEats iOS

**Date:** 2026-02-20
**Approach:** Lean Launch (Approach A)
**Timeline:** 3-4 weeks of work, 1-2 month window
**Monetization:** Free at launch, premium tier added post-launch

## Context

The EefEats mobile app (React Native/Expo) has strong feature completeness (~90% parity with web) and a polished design system. The gaps are all in packaging for the App Store: legal documents, account management, build configuration, and store listing assets.

## Decisions

- **Lean launch** — skip IAP/premium tier for v1.0, add in a future update
- **Open signups** — remove invite code requirement (keep invite system as growth mechanic)
- **Sign in with Apple** — enable it (code exists, needs provider config)
- **Bundle ID:** `com.eefeats.app`
- **Legal pages hosted at:** eefeats.com/privacy and eefeats.com/terms

## Work Items

### 1. Apple Developer Account Enrollment

- Enroll at developer.apple.com ($99/year)
- Use personal Apple ID
- Register bundle ID `com.eefeats.app`
- Do this first — enrollment can take 24-48 hours

### 2. App Configuration

**app.json changes:**
- `name`: "mobile" -> "EefEats"
- `slug`: "mobile" -> "eefeats"
- `scheme`: "mobile" -> "eefeats"
- Add `ios.bundleIdentifier`: "com.eefeats.app"
- Add `ios.buildNumber`: "1"
- Add `ios.infoPlist` usage descriptions (camera, photo library)

**EAS Build:**
- Create `eas.json` with development, preview, and production profiles
- Configure iOS distribution for App Store
- Auto-incrementing build numbers

### 3. Account Deletion (Apple Mandatory)

Every app with account creation must let users delete their account and data.

- "Delete Account" button in profile/settings screen
- Confirmation dialog explaining what gets deleted
- Backend: cascade delete all user data (recipes, ratings, follows, activity, auth user)
- Must actually delete, not deactivate

### 4. Open Signups

- Make invite code optional during signup
- Keep invite system for sharing/growth, just don't gate registration on it

### 5. Sign in with Apple

Apple guideline 4.8: strongly recommended for all apps with account creation.

- Configure Apple OAuth provider in Supabase
- Configure Service ID + key in Apple Developer portal
- Enable existing Apple auth code in login/signup screens
- Test on physical iOS device

### 6. Legal Documents

**Privacy Policy (eefeats.com/privacy):**
- Data collected: email, name, profile photo, recipe content, usage data
- Storage: Supabase (AWS infrastructure)
- Third-party services: Supabase Auth, Vercel
- Data retention and deletion procedures
- GDPR/CCPA basics
- Contact information

**Terms of Service (eefeats.com/terms):**
- User-generated content ownership and licensing
- Acceptable use policy
- Content moderation approach
- Account termination conditions
- Limitation of liability

**In-app access:**
- Both documents accessible from settings/profile screen
- Links open in in-app browser

### 7. Privacy Manifest

iOS 17+ requirement. Configure in `app.json` under `ios.privacyManifests`:
- Declare required reason APIs used
- Data types collected
- No cross-app tracking

Also fill out App Privacy "nutrition labels" in App Store Connect.

### 8. App Icon & Assets

- Verify icon is 1024x1024 PNG with no alpha channel
- Review splash screen for App Store quality
- Generate required screenshot sizes:
  - 6.7" (iPhone 15 Pro Max): 1290x2796
  - 6.5" (iPhone 11 Pro Max): 1284x2778

### 9. App Store Listing

- App name: "EefEats"
- Subtitle (30 chars): "Your Social Recipe Book"
- Description (up to 4000 chars)
- Keywords (100 chars)
- Category: Food & Drink
- Support URL: eefeats.com/support
- Privacy policy URL: eefeats.com/privacy
- Provide demo account credentials in review notes

### 10. TestFlight & Submission

- Build with EAS, upload to App Store Connect
- Internal TestFlight testing
- Full QA pass on real iPhone
- Submit for App Review
- Expect 24-48 hours review, prepare for 1-2 rounds of feedback

## Effort Estimates

| # | Work Item | Effort |
|---|-----------|--------|
| 1 | Apple Developer enrollment | Day 1 (then wait) |
| 2 | App config (app.json, eas.json) | ~half day |
| 3 | Account deletion (API + UI) | 2-3 days |
| 4 | Open signups | ~half day |
| 5 | Sign in with Apple | 1-2 days |
| 6 | Legal documents | 1-2 days |
| 7 | In-app legal links | ~2 hours |
| 8 | Privacy manifest | ~2 hours |
| 9 | App icon verification | ~half day |
| 10 | App Store listing content | 1-2 days |
| 11 | TestFlight + QA | 2-3 days |
| 12 | App Review submission | 1-3 days wait |

**Total: ~3 weeks of focused work**

## Out of Scope (Post-Launch)

- In-App Purchases / premium tier
- Cooking mode
- Offline caching
- Meal planning
- Push notifications
- Google Sign-In (nice to have, not required by Apple)
