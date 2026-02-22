## 1. Shared — Timer Regex Utility

- [ ] 1.1 Create a `parseTimers(stepText: string)` utility function that extracts time durations from instruction text using regex. Returns array of `{ minutes: number, label: string, startIndex: number }`. Patterns: "X minutes/min/mins", "X hours/hrs/hr", "X seconds/secs/sec", "X-Y minutes" (use larger number). Share implementation pattern between web and mobile.

## 2. Web — Cooking Mode View

- [ ] 2.1 Create cooking mode component at `src/app/(authenticated)/recipes/[id]/cooking-mode.tsx` — full-screen overlay, receives parsed steps and ingredients as props
- [ ] 2.2 Build step display — one step at a time, large text (24px min), high contrast, generous padding
- [ ] 2.3 Add step navigation — left/right arrow buttons, left/right arrow key handlers, click left/right halves of content area. Escape key exits.
- [ ] 2.4 Add step progress indicator — "Step N of M" with subtle progress bar
- [ ] 2.5 Add ingredient sidebar — persistent on desktop (side panel), toggleable overlay on narrow screens
- [ ] 2.6 Add Screen Wake Lock API integration — request wake lock on mount, release on unmount. Graceful fallback for unsupported browsers.
- [ ] 2.7 Add timer detection — show timer button when `parseTimers` finds time mentions, start in-page countdown on click, wall-clock-based accuracy, audible alert on completion
- [ ] 2.8 Add completion screen — shown after last step, "Done" + "Cooked It" buttons, log cook entry on tap
- [ ] 2.9 Add "Start Cooking" button on recipe detail between ingredients and instructions sections

## 3. Mobile — Cooking Mode Screen

- [ ] 3.1 Create cooking mode screen at `mobile/app/recipe/[id]/cooking.tsx` — full-screen modal (presented over tabs), receives recipe data via params or context
- [ ] 3.2 Build step display — one step at a time, large text (22pt min), high contrast, generous padding
- [ ] 3.3 Add swipe navigation — horizontal swipe gesture to navigate steps with slide animation. Add large tap targets (60pt) on left/right screen edges.
- [ ] 3.4 Add step progress indicator — "Step N of M" at the top with subtle progress bar
- [ ] 3.5 Add ingredient bottom sheet — swipe up or tap "Ingredients" button to show ingredient list overlay
- [ ] 3.6 Add expo-keep-awake integration — activate on mount, deactivate on unmount
- [ ] 3.7 Add timer detection — show timer button when time mentions found, start countdown, local notification + haptic on completion. Running timers persist across step navigation with small indicator visible on all steps.
- [ ] 3.8 Add completion screen — congratulations view after last step, "Done" + "Cooked It" buttons, haptic success feedback, log cook entry on tap
- [ ] 3.9 Add close/X button in top-left corner to exit cooking mode
- [ ] 3.10 Add "Start Cooking" button on recipe detail between ingredients and instructions sections
