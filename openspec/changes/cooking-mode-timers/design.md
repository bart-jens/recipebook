## Context

`CookingMode.tsx` is a full-screen component that receives `steps: string[]`. It has no timer state. Steps like "Simmer for 10 minutes" contain human-readable durations that need to be parsed and acted on. The component already handles back-button suppression, tab switching (steps/ingredients), and screen-awake lock.

`parseSteps` (in `mobile/lib/parse-steps.ts`) splits instruction text into step arrays. A sibling `parseDuration` function is the right place to extract minutes from a single step string.

## Goals / Non-Goals

**Goals:**
- Detect durations in step text automatically
- One-tap timer start on steps that contain a duration
- Prominent countdown display within the current step card
- Visual + audio alert on completion
- Timer survives tab switching within cooking mode

**Non-Goals:**
- Multiple simultaneous timers (one per cooking mode session)
- Background notification (deferred — notification permission flow adds complexity; do in-app alert only for now)
- Web cooking mode timers
- Editing the timer duration manually
- Named timers

## Decisions

**D1: `parseDuration(step: string): number | null`**
Returns total minutes (as a number, fractions allowed) or null if no duration detected. Patterns handled:
- `"X minutes"` / `"X mins"` / `"X min"`
- `"X hours"` / `"X hr"` / `"X h"`
- `"X hours Y minutes"` compound
- `"X to Y minutes"` range → use the upper bound Y
- Case-insensitive. Numbers can be digits or English words ("ten minutes" — optional, best effort).

**D2: Timer state in `CookingMode.tsx` (not a separate component)**
`timerSeconds: number | null`, `timerRunning: boolean`, `timerStepIndex: number | null` — three pieces of state. When user navigates to a different step, if timer is running it continues in the background (interval keeps running). Timer resets when moving to a new step only if the user explicitly taps "Reset".

**D3: `setInterval` (not `expo-notifications`)**
In-app countdown using `useEffect + setInterval(1000)`. When `timerSeconds` reaches 0: play alert sound using `expo-av` Audio API + vibrate using `expo-haptics`. Alert sound is a short bundled audio file (royalty-free kitchen timer sound). No notification permission required.

**D4: UI placement**
Below the step text, above the prev/next buttons: a row that shows detected duration ("10 min detected") and a "Start timer" button. When timer is running: a large countdown display replaces the "Start timer" row. Format: `MM:SS`. Color: `colors.accent` when running, `colors.danger` when under 30s remaining.

**D5: Timer persists across tab switch**
`activeTab` is already in state. Timer interval continues regardless of active tab. The countdown is visible when user is on the steps tab.

## Risks / Trade-offs

[Risk] `parseDuration` false positives (e.g., "serves 4" parsed as 4 minutes) → Mitigation: only match patterns with explicit time units (`minutes`, `hours`, `mins`, `hr`, `h`) — never bare numbers.

[Risk] `expo-av` adds ~300KB to the bundle → Mitigation: `expo-av` is a common Expo dependency; if already in the project, no overhead. If not, include it — bundle size is not a current constraint.

[Risk] Timer accuracy — `setInterval(1000)` drifts on CPU-heavy frames → Mitigation: use `Date.now()` reference point instead of decrementing a counter. Recalculate remaining seconds on each tick: `remaining = endTime - Date.now()`.

## Migration Plan

1. Create `mobile/lib/parse-duration.ts` and test it
2. Add timer state to `CookingMode.tsx`
3. Add detected-duration row + "Start timer" button UI to step card
4. Implement countdown display + setInterval logic
5. Add audio + haptic feedback on completion
6. Manual test across multiple timer scenarios
