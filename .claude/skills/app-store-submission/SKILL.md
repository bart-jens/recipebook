---
name: app-store-submission
description: Use when preparing an iOS release, submitting a build to TestFlight, or releasing to the App Store — to verify all requirements are met before submission.
---

# App Store Submission

## Overview

App Store rejections are slow and painful. This checklist catches the most common issues before submission. EefEats is configured with EAS for automated builds via GitHub Actions.

## EefEats App Config

- **Bundle ID**: `com.eefeats.app`
- **Apple Team ID**: `UF25XUG77C`
- **Build system**: EAS (`mobile/eas.json`)
- **CI**: `.github/workflows/ios-build.yml` (triggers on `mobile/**` push)
- **Manual build**: `cd mobile && eas build --platform ios --profile production`

## Pre-Submission Checklist

### Build Quality
- [ ] No `console.log` or debug output in production code
- [ ] All `TODO` / `FIXME` comments that affect functionality resolved
- [ ] App runs without crashes on clean install (no cached state)
- [ ] App runs on iOS 16+ (check `mobile/app.json` for `ios.deploymentTarget`)
- [ ] No hardcoded test data, staging URLs, or dev API keys

### App Store Review Guidelines (Common Rejections)
- [ ] **4.2 Minimum Functionality**: App provides meaningful value beyond a web wrapper
- [ ] **2.1 Performance**: No crashes, no placeholder UI ("lorem ipsum"), no broken links
- [ ] **5.1.1 Data Collection**: Privacy policy URL set in App Store Connect and accessible in-app
- [ ] **3.1.1 Payments**: No external payment links (if charging, use IAP). No "sign up on web" to bypass IAP.
- [ ] **4.0 Design**: Follows Apple HIG. No obviously broken layouts on any supported device size.

### Metadata (App Store Connect)
- [ ] App name: "EefEats"
- [ ] Subtitle: <= 30 chars
- [ ] Description: Clear, no keyword stuffing, no competitor mentions
- [ ] Keywords: <= 100 chars total
- [ ] Screenshots: Required for iPhone 6.7" and 6.5" (at minimum). No device bezels required but consistent.
- [ ] App Preview video (optional but improves conversion)
- [ ] Privacy policy URL: live and accessible
- [ ] Support URL: live and accessible
- [ ] Age rating: filled out (EefEats = 4+, no objectionable content)

### Privacy & Permissions
- [ ] `NSPhotoLibraryUsageDescription` set if using photo import
- [ ] `NSCameraUsageDescription` set if using camera
- [ ] No permissions requested that aren't used
- [ ] App Tracking Transparency prompt if using any IDFA (currently: not applicable)

### TestFlight (Pre-GA)
- [ ] Build submitted to TestFlight successfully
- [ ] Internal testers (Bart) can install and run
- [ ] Beta App Review approved (required for external testers)
- [ ] Export compliance question answered (EefEats: uses standard HTTPS encryption only)

## Release Process

1. Merge to `main` (or push to `mobile/**`) → GitHub Action triggers EAS build
2. EAS builds and auto-submits to TestFlight
3. TestFlight → test on device
4. App Store Connect → "Add for Review" → submit
5. Review takes 24–48 hours (expedited review available for critical bugs)

## Version Numbering

- **Version** (`CFBundleShortVersionString`): User-visible, e.g. `1.2.0`
- **Build** (`CFBundleVersion`): Monotonically increasing integer. EAS handles this automatically.
- Bump version in `mobile/app.json` before release builds.

## After Rejection

1. Read rejection reason carefully — it's usually specific
2. Check [App Store Review Guidelines](https://developer.apple.com/app-store/review/guidelines/) for the cited guideline number
3. Fix, resubmit, include a note to reviewer explaining what changed
4. If rejection seems wrong: use "Appeal" or reply to reviewer in App Store Connect
