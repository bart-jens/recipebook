## Context

Recipe instructions are currently displayed as a numbered list in the recipe detail view (both web and mobile). This works for reading but not for cooking — text is small, the screen dims, and navigating between steps requires scrolling. Cooking mode provides a focused, kitchen-optimized presentation of the same data.

No new database tables or API calls needed — this is purely a presentation layer over existing recipe data (instructions + ingredients).

## Goals / Non-Goals

**Goals:**
- Full-screen step-by-step view with large, readable text
- Keep screen awake during cooking
- Quick access to ingredients at any step
- Step progress indicator
- Timer detection from natural language ("bake for 25 minutes")
- Works on both web and mobile with platform-appropriate UX

**Non-Goals:**
- Voice control ("next step", "read ingredients") — future enhancement
- Offline caching — separate feature
- Video instruction support — future
- AI-powered timer extraction — keep it simple regex for now
- Persistent cooking session / resume where you left off — first version is stateless

## Decisions

### 1. Step parsing: reuse existing instruction splitting logic
Both web and mobile already split instructions by newline. Cooking mode uses the same parsed steps array. If a recipe has only a single paragraph (no newlines), cooking mode shows it as one big step — no artificial splitting.

### 2. Mobile: full-screen modal with swipe navigation
The cooking mode screen is a full-screen modal (presented over the tab bar) with horizontal swipe or tap-to-advance. Left/right swipe navigates steps. Large tap targets on left/right edges as an alternative to swiping. The ingredient list is accessible via a bottom sheet that slides up.

### 3. Web: dedicated view with keyboard navigation
On web, cooking mode replaces the recipe detail content (same URL, different view state). Left/right arrow keys navigate steps. Ingredients shown in a persistent sidebar on desktop, or toggleable on mobile web. Escape key exits cooking mode.

### 4. Keep-awake: expo-keep-awake on mobile, Wake Lock API on web
Mobile uses `expo-keep-awake` (activateKeepAwakeAsync / deactivateKeepAwake). Web uses the Screen Wake Lock API (`navigator.wakeLock.request('screen')`) with fallback to no-op on unsupported browsers. Both activate on entering cooking mode, deactivate on exit.

### 5. Timer detection: simple regex, not AI
Scan each step for patterns like "X minutes", "X min", "X hours" and offer a one-tap timer button when found. On mobile, start a background timer with local notification. On web, show an in-page countdown. Regex is good enough — covers "bake for 25 minutes", "simmer 10 min", "rest for 1 hour".

**Patterns to match:**
- `(\d+)\s*(minutes?|mins?|hours?|hrs?|seconds?|secs?)`
- "for X minutes" / "about X minutes" / "X-Y minutes" (use the larger number)

### 6. Entry point: "Start Cooking" button below ingredients
On recipe detail (both platforms), add a prominent "Start Cooking" button between the ingredients section and the instructions section. Only show when instructions exist. This is the primary CTA for kitchen use.

## Risks / Trade-offs

- **Single-paragraph recipes**: Some imported recipes have instructions as one blob of text with no newlines. Cooking mode will show this as a single large step. Acceptable for V1 — a future enhancement could offer AI-powered step splitting.
- **Wake Lock API support**: Not available in all browsers (Safari partial, Firefox missing). Mitigation: graceful degradation — just don't keep screen awake. Show nothing if unsupported.
- **Timer accuracy on web**: In-page timers may drift if the tab is backgrounded. Mitigation: use `setInterval` with wall-clock checks (compare elapsed against `Date.now()` start time, not cumulative interval counts).
