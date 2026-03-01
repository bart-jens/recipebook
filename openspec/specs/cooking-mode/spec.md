### Requirement: User can launch cooking mode from recipe detail
A "Start Cooking" button SHALL appear on the recipe detail screen for any recipe that has a non-empty `instructions` field. The button SHALL be visible to all users regardless of plan (free or premium).

#### Scenario: Launch from mobile recipe detail
- **WHEN** user views a recipe with instructions on mobile
- **THEN** a "Start Cooking" button is visible below the metadata row (prep/cook time, servings)

#### Scenario: Launch from web recipe detail
- **WHEN** user views a recipe with instructions on web
- **THEN** a "Start Cooking" button is visible on the recipe detail page

#### Scenario: No button for empty instructions
- **WHEN** a recipe has no instructions (null or empty string)
- **THEN** no "Start Cooking" button is shown

---

### Requirement: Cooking mode is full-screen and modal
Cooking mode SHALL open as a full-screen modal that overlays the recipe detail. The recipe detail SHALL remain mounted underneath. Exiting cooking mode SHALL return the user to the recipe detail with scroll position preserved.

#### Scenario: Open cooking mode on mobile
- **WHEN** user taps "Start Cooking"
- **THEN** a full-screen modal opens covering the recipe detail

#### Scenario: Exit restores recipe detail
- **WHEN** user exits cooking mode (via the × button)
- **THEN** the modal dismisses and the recipe detail is visible at the same scroll position

---

### Requirement: Screen stays awake during cooking mode
The device screen SHALL be kept awake for the entire duration of cooking mode. Screen keep-awake SHALL activate when cooking mode opens and release when it closes or is dismissed.

#### Scenario: Screen does not sleep during cooking (mobile)
- **WHEN** cooking mode is open on mobile
- **THEN** the screen keep-awake lock is active via expo-keep-awake

#### Scenario: Screen keep-awake released on exit
- **WHEN** cooking mode is dismissed
- **THEN** the screen keep-awake lock is released

#### Scenario: Web Wake Lock on supported browsers
- **WHEN** cooking mode is open on web in a browser that supports the Wake Lock API
- **THEN** navigator.wakeLock.request('screen') is called

#### Scenario: Graceful degradation on unsupported browsers
- **WHEN** the Wake Lock API is not available in the browser
- **THEN** cooking mode functions normally without showing any error

---

### Requirement: Steps are parsed from instructions at runtime
The `instructions` text field SHALL be split into discrete steps at cooking mode entry. Splitting SHALL handle: numbered lists (`1. text`), labelled steps (`Step 1: text`), and newline-separated paragraphs. Empty lines SHALL be discarded.

#### Scenario: Numbered list instructions
- **WHEN** instructions contain lines like "1. Boil water\n2. Add pasta"
- **THEN** steps are ["Boil water", "Add pasta"]

#### Scenario: Step-labelled instructions
- **WHEN** instructions contain "Step 1: Boil water\nStep 2: Add pasta"
- **THEN** steps are ["Boil water", "Add pasta"]

#### Scenario: Bare paragraph instructions
- **WHEN** instructions contain "Boil water.\n\nAdd pasta and cook for 8 minutes."
- **THEN** steps are ["Boil water.", "Add pasta and cook for 8 minutes."]

#### Scenario: Single-paragraph instructions
- **WHEN** instructions contain no newlines
- **THEN** the entire instructions text is treated as a single step

---

### Requirement: Cooking mode header
The cooking mode header SHALL display: an exit button (top-left), the recipe title truncated to one line (center), and a step counter showing current position (e.g., "3 / 8") (top-right). The exit button SHALL be explicit (× icon) — no back-swipe gesture to dismiss.

#### Scenario: Header shows step progress
- **WHEN** user is on step 3 of 8
- **THEN** header shows "3 / 8"

#### Scenario: No accidental dismissal
- **WHEN** user swipes down on the modal
- **THEN** the modal does NOT dismiss

---

### Requirement: Steps/Ingredients segment control
A segment control with two tabs — **Steps** and **Ingredients** — SHALL appear below the header. Tapping a tab SHALL switch the body content. Swipe left/right SHALL NOT be used for segment switching (swipe is reserved to avoid conflict with scroll gestures).

#### Scenario: Switch to Ingredients tab
- **WHEN** user taps "Ingredients" tab
- **THEN** the body shows a scrollable ingredient list

#### Scenario: Switch back to Steps tab
- **WHEN** user taps "Steps" tab while viewing ingredients
- **THEN** the body shows the current step at the same step index

---

### Requirement: Step body — one step at a time
The Steps body SHALL show exactly one step at a time. The step SHALL display: a muted step label (e.g., "Step 3") and the step text in large, readable body size (≥ 20pt equivalent). If the step text is long, it SHALL scroll vertically within the body area. Surrounding steps SHALL NOT be visible.

#### Scenario: Single step displayed
- **WHEN** user is on step 2
- **THEN** only step 2 text is shown (not step 1 or step 3)

#### Scenario: Long step scrolls
- **WHEN** a step text overflows the body area
- **THEN** the body area scrolls vertically to reveal the full step text

---

### Requirement: Progress bar
A thin progress bar SHALL appear directly below the segment control when the Steps tab is active. It SHALL fill left-to-right proportionally to the current step (e.g., step 3 of 8 = 37.5% filled). The progress bar SHALL NOT appear when the Ingredients tab is active.

#### Scenario: Progress on step 1 of 4
- **WHEN** user is on step 1 of 4
- **THEN** progress bar is 25% filled

#### Scenario: Progress bar hidden on Ingredients tab
- **WHEN** Ingredients tab is active
- **THEN** progress bar is not visible

---

### Requirement: Step navigation — Prev/Next buttons
Two buttons SHALL be fixed at the bottom of the screen: **Previous** (ghost style) and **Next** (primary style). Both SHALL have a minimum tap target of 44×44pt. On step 1, Previous SHALL be hidden (not disabled). On the last step, Next SHALL be labeled **"Done"**.

#### Scenario: Previous hidden on first step
- **WHEN** user is on step 1
- **THEN** the Previous button is not visible

#### Scenario: Previous visible on step 2+
- **WHEN** user is on step 2 or later
- **THEN** the Previous button is visible

#### Scenario: Next labeled "Done" on last step
- **WHEN** user is on the last step
- **THEN** the Next button label reads "Done"

#### Scenario: Tap Next advances step
- **WHEN** user taps Next on a non-last step
- **THEN** the displayed step advances by one

#### Scenario: Tap Previous goes back
- **WHEN** user taps Previous
- **THEN** the displayed step decrements by one

---

### Requirement: Ingredients view in cooking mode
The Ingredients tab body SHALL display a full, scrollable list of the recipe's ingredients in the same format as the recipe detail (quantity, unit, name, notes). A unit system toggle (metric/imperial) SHALL be available. The ingredient list is read-only.

#### Scenario: All ingredients shown
- **WHEN** user switches to Ingredients tab
- **THEN** all recipe ingredients are listed in order_index order

#### Scenario: Unit toggle preserved
- **WHEN** user toggles metric/imperial in cooking mode
- **THEN** ingredient quantities update to reflect the selected unit system

---

### Requirement: Completion screen after last step
When the user taps **Done** on the last step, cooking mode SHALL transition to a completion screen (within the same modal). The completion screen SHALL show: a heading ("You cooked it!"), the recipe title, an optional 1–5 star rating row, an optional notes field, a **Save & Finish** button (primary), and a **Skip** button (ghost).

#### Scenario: Done transitions to completion screen
- **WHEN** user taps Done on the last step
- **THEN** the cooking mode body shows the completion screen

#### Scenario: Save & Finish writes rating
- **WHEN** user taps Save & Finish with a star rating selected
- **THEN** a new row is inserted into recipe_ratings with today's date, the selected rating, and any notes entered

#### Scenario: Save & Finish without rating
- **WHEN** user taps Save & Finish with no star rating selected
- **THEN** the modal dismisses without writing to recipe_ratings

#### Scenario: Skip dismisses without writing
- **WHEN** user taps Skip
- **THEN** the modal dismisses and no rating row is written

---

### Requirement: Web cooking mode — keyboard navigation
On web, the cooking mode overlay SHALL support keyboard navigation: left/right arrow keys advance and retreat steps; Escape exits the overlay (with a confirmation prompt if the user is mid-cook, i.e., past step 1).

#### Scenario: Arrow key step navigation
- **WHEN** user presses → (right arrow)
- **THEN** the displayed step advances by one (if not on last step)

#### Scenario: Escape with confirmation mid-cook
- **WHEN** user presses Escape while past step 1
- **THEN** a confirmation prompt appears before dismissing

#### Scenario: Escape on step 1 dismisses immediately
- **WHEN** user presses Escape on step 1
- **THEN** the overlay dismisses without a confirmation prompt

---

### Requirement: Web cooking mode — reduced motion
The cooking mode overlay transitions SHALL respect the `prefers-reduced-motion` media query. When the user prefers reduced motion, step transition animations SHALL be disabled.

#### Scenario: Reduced motion disables animations
- **WHEN** user's OS has prefers-reduced-motion enabled
- **THEN** step transitions have no animation
