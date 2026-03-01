---
name: accessibility-review
description: Use when building or modifying any UI screen — to verify tap targets, color contrast, font sizes, and screen reader support meet accessibility standards for a mobile-first kitchen app.
---

# Accessibility Review

## Overview

EefEats is a kitchen app used with messy hands, bad lighting, and divided attention. Accessibility isn't a compliance checkbox — it's a product quality requirement. A screen that's hard to use for someone with low vision is also hard to use for someone with flour on their fingers.

## Review Checklist

### Touch Targets (Mobile)
- [ ] Every tappable element is at minimum **44×44pt** (Apple HIG requirement)
- [ ] Tappable elements have sufficient spacing between them (minimum 8pt gap)
- [ ] No tappable text that's too small to tap accurately

### Color Contrast
- [ ] Text on background meets **WCAG AA** minimum: 4.5:1 for normal text, 3:1 for large text (18pt+)
- [ ] Interactive elements (buttons, links) have 3:1 contrast ratio against background
- [ ] No information conveyed by color alone (e.g., red = error must also have icon or text)
- [ ] All colors come from `theme.ts` tokens — no hardcoded hex values in component files

### Typography
- [ ] Minimum body font size: **16pt** (our theme: `body` token)
- [ ] No text smaller than `metaSmall` token in critical UI paths
- [ ] Line height sufficient for readability (check theme tokens)
- [ ] No ALL CAPS text (per project rule: no uppercase anywhere)

### Screen Reader (iOS VoiceOver / Android TalkBack)
- [ ] Interactive elements have `accessibilityLabel` (mobile) or `aria-label` (web)
- [ ] Images have descriptive alt text (or `aria-hidden` if decorative)
- [ ] Form inputs have associated labels
- [ ] Error messages are announced (not just visually shown)
- [ ] Tab/focus order is logical

### Cooking Mode (Special Consideration)
EefEats cooking mode is used hands-free. Extra requirements:
- [ ] Text is large enough to read at arm's length (use `heading` or `subheading` tokens)
- [ ] Step navigation targets are extra-large (60×60pt minimum)
- [ ] High contrast mode works correctly
- [ ] No time-limited interactions (no auto-advancing steps)

### Web Accessibility
- [ ] Semantic HTML used (`<button>`, `<nav>`, `<main>`, `<h1>` hierarchy)
- [ ] Keyboard navigation works (tab through all interactive elements)
- [ ] Focus indicators visible (not removed with `outline: none` without replacement)
- [ ] `role` and `aria-*` attributes for custom components

## Design System Reference

EefEats typography tokens (from `mobile/lib/theme.ts`):
- `title` — screen titles
- `heading` — section headings
- `subheading` — subsection headings
- `body` — primary content
- `bodySmall` — secondary content
- `label` — UI labels
- `meta` — metadata
- `metaSmall` — minimum size, use sparingly

Never go below `metaSmall` for user-visible text.

## Quick Checks (Fast Review)

Run these on any new screen:
1. Zoom to 200% — does content reflow or get cut off?
2. Enable VoiceOver — can you navigate the screen without looking at it?
3. Use one thumb, one-handed — can you reach all key actions?
4. Check in bright light (outdoors) — is contrast sufficient?
5. Check with flour on your hands (conceptually) — are tap targets big enough?
