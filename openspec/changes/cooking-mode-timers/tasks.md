## 1. Parse Duration Utility

- [ ] 1.1 Create `mobile/lib/parse-duration.ts` — export `parseDuration(step: string): number | null` handling minutes, hours, compounds, and ranges
- [ ] 1.2 Create `src/__tests__/parse-duration.test.ts` — unit tests covering: basic minutes, hours, compound (1hr 30min), range (15 to 20 min), no-match cases (bare numbers, no unit), case-insensitivity

## 2. Timer State in CookingMode

- [ ] 2.1 In `mobile/components/ui/CookingMode.tsx`, add timer state: `timerEndTime: number | null`, `timerRunning: boolean`
- [ ] 2.2 Add `useEffect` for the `setInterval(1000)` countdown ticker — calculate remaining seconds from `timerEndTime - Date.now()`; clear interval when timer reaches zero or component unmounts
- [ ] 2.3 Compute `detectedDuration = parseDuration(steps[currentStep])` for the current step

## 3. Timer UI

- [ ] 3.1 When `detectedDuration !== null` and timer is not running: show "Start timer — X min" button below step text
- [ ] 3.2 When timer is running: show MM:SS countdown below step text; color `colors.danger` when ≤ 30 seconds remain; show "Reset" button
- [ ] 3.3 When timer has just completed (`timerSeconds === 0`): show "Time's up!" message and "Done" button; tapping Done resets timer state
- [ ] 3.4 When a new step is navigated to and timer is NOT running: clear any previous detected duration display (no carry-over)

## 4. Alert on Completion

- [ ] 4.1 Install `expo-av` if not already present (`npx expo install expo-av`)
- [ ] 4.2 Bundle a short timer chime audio file at `mobile/assets/sounds/timer-complete.mp3`
- [ ] 4.3 On timer completion: play chime via `expo-av` Audio API
- [ ] 4.4 On timer completion: trigger `Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)`

## 5. Verify

- [ ] 5.1 Run `npx tsc --noEmit` in `mobile/` — zero type errors
- [ ] 5.2 Run `src/__tests__/parse-duration.test.ts` — all tests pass
- [ ] 5.3 Manual test: open a recipe with a timed step (e.g., "Simmer for 5 minutes"), enter cooking mode, confirm timer button appears
- [ ] 5.4 Manual test: start timer, switch to Ingredients tab and back — confirm timer is still running
- [ ] 5.5 Manual test: let timer complete — confirm haptic + sound fires
