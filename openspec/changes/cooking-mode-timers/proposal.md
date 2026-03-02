## Why

Cooking mode (shipped Sprint 1) shows steps one at a time, but has no timer support. Steps like "simmer for 10 minutes" or "bake at 180°C for 25 minutes" contain duration cues that users must track manually. Per-step countdown timers complete the cooking mode experience and are the main feature gap compared to Paprika and other dedicated kitchen apps. Users in the kitchen with messy hands need a single tap to start a timer and an audible + visual alert when done.

## What Changes

- Parse duration cues from step text using the existing `parseSteps` utility (extend it or add a sibling `parseDuration` function)
- In cooking mode, detect if the current step contains a duration (e.g., "10 minutes", "25 min", "1 hour 30 min")
- If a duration is detected, show a "Start timer" button on that step
- Tapping "Start timer" starts a countdown displayed prominently in the step view
- When the timer reaches zero: play a system sound + show a visual "Time's up!" alert
- Timer persists if the user navigates to the ingredients tab and back within cooking mode
- Use `expo-notifications` for background timer alert (if app is backgrounded during cooking)
- Scope: mobile only (cooking mode is mobile-first; web overlay exists but timers are mobile-only for now)

## Capabilities

### New Capabilities
- `cooking-mode-timers`: Per-step countdown timers in cooking mode with audio + visual alert

### Modified Capabilities
- `cooking-mode`: Timer integration changes cooking mode behavior for steps with duration cues

## Impact

- **New file**: `mobile/lib/parse-duration.ts` — extracts minutes from step text (e.g., "Simmer for 10 minutes" → 10)
- **Modified**: `mobile/components/ui/CookingMode.tsx` — adds timer state + UI to the steps tab
- **New dependency**: `expo-av` (for timer sound) or native system sound via `expo-haptics` + `Alert`
- **Expo permissions**: may need notification permission for background timer
- **No DB changes, no web changes**
